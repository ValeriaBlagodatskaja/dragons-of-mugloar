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
});
