import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";

import GameOverModal from "./GameOverModal.vue";

describe("GameOverModal", () => {
  it("shows the game over message and final game stats", () => {
    const wrapper = mount(GameOverModal, {
      props: {
        score: 4272,
        gold: 22,
        level: 30,
      },
    });

    expect(wrapper.get(".notice-modal").classes()).toContain("notice-failure");
    expect(wrapper.get(".notice-modal").classes()).toContain("game-over-modal");

    expect(wrapper.get(".notice-icon").text()).toBe("☠");
    expect(wrapper.get(".notice-eyebrow").text()).toBe("Game Over");

    expect(wrapper.text()).toContain("Your dragon has fallen");
    expect(wrapper.text()).toContain("The adventure has come to an end.");
  });

  it("shows the final score, gold and level", () => {
    const wrapper = mount(GameOverModal, {
      props: {
        score: 4272,
        gold: 22,
        level: 30,
      },
    });

    const stats = wrapper.findAll(".game-over-stats > div");

    expect(stats).toHaveLength(3);

    expect(stats[0].text()).toContain("Final Score");
    expect(stats[0].text()).toContain("4272");

    expect(stats[1].text()).toContain("Gold");
    expect(stats[1].text()).toContain("22");

    expect(stats[2].text()).toContain("Level");
    expect(stats[2].text()).toContain("30");
  });

  it("renders zero values correctly", () => {
    const wrapper = mount(GameOverModal, {
      props: {
        score: 0,
        gold: 0,
        level: 0,
      },
    });

    const stats = wrapper.findAll(".game-over-stats strong");

    expect(stats).toHaveLength(3);
    expect(stats[0].text()).toBe("0");
    expect(stats[1].text()).toBe("0");
    expect(stats[2].text()).toBe("0");
  });

  it("emits close when Try Again is clicked", async () => {
    const wrapper = mount(GameOverModal, {
      props: {
        score: 1500,
        gold: 100,
        level: 12,
      },
    });

    await wrapper.get("button").trigger("click");

    expect(wrapper.emitted("close")).toHaveLength(1);
  });
});
