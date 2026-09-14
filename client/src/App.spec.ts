import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it } from "vitest";

import App from "./App.vue";
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
});
