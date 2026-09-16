import { mount } from "@vue/test-utils";
import { nextTick } from "vue";
import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it } from "vitest";

import App from "./App.vue";
import GameOverModal from "./components/GameOverModal.vue";
import { useGameStore } from "./stores/gameStore";

describe("App", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it("renders available missions and highlights the recommended one", () => {
    const pinia = createPinia();
    setActivePinia(pinia);

    const store = useGameStore();

    store.messages = [
      {
        missionId: "mission-1",
        message: "Rescue the princess",
        reward: "100",
        expiresIn: 5,
        probability: "Piece of cake",
        recommended: true,
      },
      {
        missionId: "mission-2",
        message: "Fight the giant",
        reward: "200",
        expiresIn: 3,
        probability: "Playing with fire",
        recommended: false,
      },
    ];

    const wrapper = mount(App, {
      global: {
        plugins: [pinia],
      },
    });

    expect(wrapper.text()).toContain("Available Missions");
    expect(wrapper.text()).toContain("Rescue the princess");
    expect(wrapper.text()).toContain("Fight the giant");
    expect(wrapper.text()).toContain("Recommended");
  });

  it("disables mission actions while a mission is being solved", () => {
    const pinia = createPinia();
    setActivePinia(pinia);

    const store = useGameStore();

    store.messages = [
      {
        missionId: "mission-1",
        message: "Rescue the princess",
        reward: "100",
        expiresIn: 5,
        probability: "Piece of cake",
        recommended: true,
      },
      {
        missionId: "mission-2",
        message: "Fight the giant",
        reward: "200",
        expiresIn: 3,
        probability: "Gamble",
        recommended: false,
      },
    ];

    store.solvingMissionId = "mission-1";

    const wrapper = mount(App, {
      global: {
        plugins: [pinia],
      },
    });

    const missionButtons = wrapper.findAll(".mission-card button");

    expect(missionButtons).toHaveLength(2);

    expect(missionButtons[0].text()).toBe("Solving...");
    expect(missionButtons[0].attributes("disabled")).toBeDefined();

    expect(missionButtons[1].text()).toBe("Solve");
    expect(missionButtons[1].attributes("disabled")).toBeDefined();
  });

  it("disables shop actions while an item is being purchased", async () => {
    const pinia = createPinia();
    setActivePinia(pinia);

    const store = useGameStore();

    store.gameId = "test-game";
    store.manualStatus = "running";
    store.gold = 500;
    store.shopItems = [
      {
        id: "hpot",
        name: "Healing potion",
        cost: 50,
      },
      {
        id: "cs",
        name: "Claw Sharpening",
        cost: 100,
      },
    ];

    store.buyingItemId = "hpot";

    const wrapper = mount(App, {
      global: {
        plugins: [pinia],
      },
    });

    await wrapper.get(".shop-button").trigger("click");

    const buyButtons = wrapper.findAll(".shop-card button");

    expect(buyButtons).toHaveLength(2);

    expect(buyButtons[0].text()).toBe("Buying...");
    expect(buyButtons[0].attributes("disabled")).toBeDefined();

    expect(buyButtons[1].text()).toBe("Buy");
    expect(buyButtons[1].attributes("disabled")).toBeDefined();

    expect(wrapper.text()).toContain(
      "Purchasing an item advances the game by one turn",
    );
  });

  it("disables auto play while a manual game is running", () => {
    const pinia = createPinia();
    setActivePinia(pinia);

    const store = useGameStore();

    store.gameId = "manual-game";
    store.manualStatus = "running";
    store.autoStatus = "idle";

    const wrapper = mount(App, {
      global: {
        plugins: [pinia],
      },
    });

    const playCards = wrapper.findAll(".play-card");

    const manualStartButton = playCards[0].find("button");
    const autoStartButton = playCards[1].find("button");

    expect(manualStartButton.attributes("disabled")).toBeDefined();
    expect(autoStartButton.attributes("disabled")).toBeDefined();

    expect(wrapper.text()).toContain("Open Shop");
    expect(wrapper.text()).toContain("End Game");
  });

  it("shows the game over modal and resets the game when trying again", async () => {
    const pinia = createPinia();
    setActivePinia(pinia);

    const store = useGameStore();

    store.gameId = "finished-game";
    store.score = 4272;
    store.gold = 22;
    store.lives = 0;
    store.level = 30;
    store.gameOver = true;

    const wrapper = mount(App, {
      global: {
        plugins: [pinia],
      },
    });

    expect(wrapper.text()).toContain("Game Over");
    expect(wrapper.text()).toContain("Your dragon has fallen");
    expect(wrapper.text()).toContain("4272");
    expect(wrapper.text()).toContain("Try Again");

    const gameOverModal = wrapper.findComponent(GameOverModal);

    gameOverModal.vm.$emit("close");
    await nextTick();

    expect(store.gameOver).toBe(false);
    expect(store.score).toBe(0);
    expect(store.gold).toBe(0);
    expect(store.lives).toBe(3);
    expect(store.level).toBe(0);
  });

  it("shows mission risk levels with the correct classes", () => {
    const pinia = createPinia();
    setActivePinia(pinia);

    const store = useGameStore();

    store.messages = [
      {
        missionId: "safe",
        message: "Safe mission",
        reward: "50",
        expiresIn: 5,
        probability: "Sure thing",
        recommended: true,
      },
      {
        missionId: "medium",
        message: "Medium mission",
        reward: "100",
        expiresIn: 4,
        probability: "Gamble",
        recommended: false,
      },
      {
        missionId: "dangerous",
        message: "Dangerous mission",
        reward: "500",
        expiresIn: 3,
        probability: "Playing with fire",
        recommended: false,
      },
    ];

    const wrapper = mount(App, {
      global: {
        plugins: [pinia],
      },
    });

    const probabilities = wrapper.findAll(".probability");

    expect(probabilities[0].classes()).toContain("risk-low");
    expect(probabilities[1].classes()).toContain("risk-medium");
    expect(probabilities[2].classes()).toContain("risk-high");
  });

  it("keeps mission solve actions visible after closing the shop", async () => {
    const pinia = createPinia();
    setActivePinia(pinia);

    const store = useGameStore();

    store.gameId = "test-game";
    store.manualStatus = "running";
    store.gold = 100;

    store.messages = [
      {
        missionId: "mission-1",
        message: "Rescue the princess",
        reward: "100",
        expiresIn: 5,
        probability: "Piece of cake",
        recommended: true,
      },
      {
        missionId: "mission-2",
        message: "Fight the giant",
        reward: "200",
        expiresIn: 3,
        probability: "Gamble",
        recommended: false,
      },
    ];

    store.shopItems = [
      {
        id: "hpot",
        name: "Healing potion",
        cost: 50,
      },
    ];

    const wrapper = mount(App, {
      global: {
        plugins: [pinia],
      },
    });

    const openShopButton = wrapper.find(".shop-button");

    expect(openShopButton.exists()).toBe(true);

    await openShopButton.trigger("click");

    expect(wrapper.find(".modal").exists()).toBe(true);

    await wrapper.get(".modal-close").trigger("click");

    expect(wrapper.find(".modal").exists()).toBe(false);

    const solveButtons = wrapper.findAll(".mission-card > button");

    expect(solveButtons).toHaveLength(2);
    expect(solveButtons[0].text()).toBe("Solve");
    expect(solveButtons[1].text()).toBe("Solve");
  });
});
