import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";

import { apiUrl } from "../api";
import { useGameStore } from "./gameStore";

describe("gameStore", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.restoreAllMocks();
  });

  it("starts a new manual game and updates the game state", async () => {
    const store = useGameStore();

    vi.spyOn(store, "loadMessages").mockResolvedValue();
    vi.spyOn(store, "loadShop").mockResolvedValue();

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          gameId: "test-game",
          score: 0,
          lives: 3,
          gold: 0,
          level: 1,
        }),
      }),
    );

    await store.startManualGame();

    expect(store.gameId).toBe("test-game");
    expect(store.score).toBe(0);
    expect(store.lives).toBe(3);
    expect(store.gold).toBe(0);
    expect(store.level).toBe(1);
    expect(store.manualStatus).toBe("running");

    expect(store.loadMessages).toHaveBeenCalledOnce();
    expect(store.loadShop).toHaveBeenCalledOnce();
  });

  it("handles an error when starting a manual game fails", async () => {
    const store = useGameStore();

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
      }),
    );

    await store.startManualGame();

    expect(store.manualStatus).toBe("error");
    expect(store.error).toBe("Failed to start adventure");
    expect(store.gameId).toBeNull();
  });

  it("solves a mission and updates the game state", async () => {
    const store = useGameStore();

    store.gameId = "test-game";

    vi.spyOn(store, "loadMessages").mockResolvedValue();

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          message: "Mission completed",
          score: 250,
          lives: 3,
          gold: 40,
        }),
      }),
    );

    await store.solveMission("mission-123");

    expect(store.score).toBe(250);
    expect(store.lives).toBe(3);
    expect(store.gold).toBe(40);
    expect(store.error).toBeNull();

    expect(fetch).toHaveBeenCalledWith(
      apiUrl("/api/game/test-game/missions/mission-123/solve"),
      {
        method: "POST",
      },
    );

    expect(store.loadMessages).toHaveBeenCalledOnce();
  });

  it("prevents solving another mission while a solve request is in progress", async () => {
    const store = useGameStore();

    store.gameId = "test-game";
    store.solvingMissionId = "mission-1";

    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await store.solveMission("mission-2");

    expect(fetchMock).not.toHaveBeenCalled();
    expect(store.solvingMissionId).toBe("mission-1");
  });

  it("refreshes missions when the selected mission has expired", async () => {
    const store = useGameStore();

    store.gameId = "test-game";

    vi.spyOn(store, "loadMessages").mockResolvedValue();

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 410,
      }),
    );

    await store.solveMission("expired-mission");

    expect(store.error).toBe(
      "This mission has expired. Please choose another mission.",
    );
    expect(store.loadMessages).toHaveBeenCalledOnce();
  });

  it("refreshes missions when a mission cannot be completed", async () => {
    const store = useGameStore();

    store.gameId = "test-game";

    vi.spyOn(store, "loadMessages").mockResolvedValue();

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
      }),
    );

    await store.solveMission("unavailable-mission");

    expect(store.error).toBe(
      "This mission could not be completed. Please choose another mission.",
    );
    expect(store.loadMessages).toHaveBeenCalledOnce();
  });

  it("buys a shop item and updates the game state", async () => {
    const store = useGameStore();

    store.gameId = "test-game";
    store.gold = 100;
    store.shopItems = [
      {
        id: "hpot",
        name: "Healing potion",
        cost: 50,
      },
    ];

    vi.spyOn(store, "loadShop").mockResolvedValue();
    vi.spyOn(store, "loadMessages").mockResolvedValue();

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          shoppingSuccess: true,
          gold: 50,
          lives: 4,
          level: 0,
          turn: 1,
        }),
      }),
    );

    await store.buyItem("hpot");

    expect(store.gold).toBe(50);
    expect(store.lives).toBe(4);
    expect(store.level).toBe(0);
    expect(store.error).toBeNull();

    expect(fetch).toHaveBeenCalledWith(
      apiUrl("/api/game/test-game/shop/hpot/buy"),
      {
        method: "POST",
      },
    );

    expect(store.loadShop).toHaveBeenCalledOnce();
    expect(store.loadMessages).toHaveBeenCalledOnce();
  });

  it("prevents another purchase while a shop request is in progress", async () => {
    const store = useGameStore();

    store.gameId = "test-game";
    store.buyingItemId = "hpot";

    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await store.buyItem("cs");

    expect(fetchMock).not.toHaveBeenCalled();
    expect(store.buyingItemId).toBe("hpot");
  });

  it("handles a rejected shop purchase", async () => {
    const store = useGameStore();

    store.gameId = "test-game";
    store.gold = 100;

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          shoppingSuccess: false,
          gold: 100,
          lives: 3,
          level: 0,
          turn: 1,
        }),
      }),
    );

    await store.buyItem("hpot");

    expect(store.error).toBe("Purchase failed");
    expect(store.purchaseResult).toBeNull();
  });

  it("ends the manual game when the last life is lost", async () => {
    const store = useGameStore();

    store.gameId = "test-game";
    store.lives = 1;
    store.messages = [
      {
        missionId: "mission-1",
        message: "Dangerous mission",
        recommended: false,
        reward: "100",
        expiresIn: 3,
        probability: "Gamble",
      },
    ];

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: false,
          message: "Mission failed",
          score: 100,
          lives: 0,
          gold: 20,
        }),
      }),
    );

    await store.solveMission("mission-1");

    expect(store.lives).toBe(0);
    expect(store.gameOver).toBe(true);
    expect(store.messages).toEqual([]);
    expect(store.missionResult?.livesRemaining).toBe(0);
  });

  it("ends the auto game when no lives remain", async () => {
    const store = useGameStore();

    store.autoStatus = "running";

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          status: "finished",
          state: {
            gameId: "auto-game",
            score: 1500,
            lives: 0,
            gold: 40,
            level: 10,
          },
        }),
      }),
    );

    await store.trackGameProgress();

    expect(store.autoStatus).toBe("finished");
    expect(store.score).toBe(1500);
    expect(store.lives).toBe(0);
    expect(store.gameOver).toBe(true);
  });

  it("ends a manual game and resets the game state", () => {
    const store = useGameStore();

    store.gameId = "test-game";
    store.score = 850;
    store.gold = 120;
    store.lives = 2;
    store.level = 5;
    store.manualStatus = "running";
    store.messages = [
      {
        missionId: "mission-1",
        message: "Test mission",
        recommended: true,
        reward: "50",
        expiresIn: 3,
        probability: "Sure thing",
      },
    ];

    store.endManualGame();

    expect(store.gameId).toBeNull();
    expect(store.score).toBe(0);
    expect(store.gold).toBe(0);
    expect(store.lives).toBe(3);
    expect(store.level).toBe(0);
    expect(store.messages).toEqual([]);
    expect(store.manualStatus).toBe("idle");
    expect(store.autoStatus).toBe("idle");
  });

  it("stops an automatic game and resets the game state", async () => {
    const store = useGameStore();

    store.gameId = "auto-game";
    store.score = 1200;
    store.gold = 80;
    store.lives = 2;
    store.level = 10;
    store.autoStatus = "running";

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
    });

    vi.stubGlobal("fetch", fetchMock);

    await store.endAutoGame();

    expect(fetchMock).toHaveBeenCalledWith(apiUrl("/api/auto-game/stop"), {
      method: "POST",
    });

    expect(store.gameId).toBeNull();
    expect(store.score).toBe(0);
    expect(store.gold).toBe(0);
    expect(store.lives).toBe(3);
    expect(store.level).toBe(0);
    expect(store.autoStatus).toBe("idle");
    expect(store.manualStatus).toBe("idle");
  });

  it("resets the game state after game over", () => {
    const store = useGameStore();

    store.gameId = "finished-game";
    store.score = 4272;
    store.gold = 22;
    store.lives = 0;
    store.level = 30;
    store.gameOver = true;
    store.autoStatus = "finished";

    store.shopItems = [{ id: "hpot", name: "Healing potion", cost: 50 }];

    store.closeGameOver();

    expect(store.gameOver).toBe(false);
    expect(store.gameId).toBeNull();
    expect(store.score).toBe(0);
    expect(store.gold).toBe(0);
    expect(store.lives).toBe(3);
    expect(store.level).toBe(0);
    expect(store.autoStatus).toBe("idle");
    expect(store.manualStatus).toBe("idle");
    expect(store.shopItems).toEqual([]);
  });
});
