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
});
