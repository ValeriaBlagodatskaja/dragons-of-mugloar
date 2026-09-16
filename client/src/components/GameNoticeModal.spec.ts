import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";

import GameNoticeModal from "./GameNoticeModal.vue";

describe("GameNoticeModal", () => {
  it("shows the successful mission result and rewards", () => {
    const wrapper = mount(GameNoticeModal, {
      props: {
        success: true,
        message: "The princess was rescued",
        scoreGained: 150,
        goldGained: 75,
        livesLost: 0,
        livesRemaining: 3,
      },
    });

    expect(wrapper.classes()).toContain("notice-backdrop");

    expect(wrapper.get(".notice-modal").classes()).toContain("notice-success");
    expect(wrapper.get(".notice-icon").text()).toBe("✓");
    expect(wrapper.get(".notice-eyebrow").text()).toBe("Victory");

    expect(wrapper.text()).toContain("Mission Completed");
    expect(wrapper.text()).toContain("The princess was rescued");
    expect(wrapper.text()).toContain("+150 score");
    expect(wrapper.text()).toContain("+75 gold");

    expect(wrapper.find(".notice-lives").exists()).toBe(false);
  });

  it("shows the failed mission result and lost lives", () => {
    const wrapper = mount(GameNoticeModal, {
      props: {
        success: false,
        message: "The dragon was defeated",
        scoreGained: 0,
        goldGained: 0,
        livesLost: 1,
        livesRemaining: 2,
      },
    });

    expect(wrapper.get(".notice-modal").classes()).toContain("notice-failure");
    expect(wrapper.get(".notice-icon").text()).toBe("!");
    expect(wrapper.get(".notice-eyebrow").text()).toBe("Defeat");

    expect(wrapper.text()).toContain("Mission Failed");
    expect(wrapper.text()).toContain("The dragon was defeated");
    expect(wrapper.text()).toContain("-1 life");
    expect(wrapper.text()).toContain("2 lives remaining");

    expect(wrapper.find(".notice-rewards").exists()).toBe(false);
  });

  it("uses singular text when one life remains", () => {
    const wrapper = mount(GameNoticeModal, {
      props: {
        success: false,
        message: "Mission failed",
        scoreGained: 0,
        goldGained: 0,
        livesLost: 2,
        livesRemaining: 1,
      },
    });

    expect(wrapper.text()).toContain("-2 lives");
    expect(wrapper.text()).toContain("1 life remaining");
  });

  it("does not show rewards with zero values", () => {
    const wrapper = mount(GameNoticeModal, {
      props: {
        success: true,
        message: "Mission completed",
        scoreGained: 0,
        goldGained: 0,
        livesLost: 0,
        livesRemaining: 3,
      },
    });

    expect(wrapper.find(".notice-rewards").exists()).toBe(true);
    expect(wrapper.find(".notice-rewards").text()).toBe("");
  });

  it("emits close when the Continue button is clicked", async () => {
    const wrapper = mount(GameNoticeModal, {
      props: {
        success: true,
        message: "Mission completed",
        scoreGained: 100,
        goldGained: 50,
        livesLost: 0,
        livesRemaining: 3,
      },
    });

    await wrapper.get("button").trigger("click");

    expect(wrapper.emitted("close")).toHaveLength(1);
  });

  it("emits close when the backdrop is clicked", async () => {
    const wrapper = mount(GameNoticeModal, {
      props: {
        success: true,
        message: "Mission completed",
        scoreGained: 100,
        goldGained: 50,
        livesLost: 0,
        livesRemaining: 3,
      },
    });

    await wrapper.get(".notice-backdrop").trigger("click");

    expect(wrapper.emitted("close")).toHaveLength(1);
  });

  it("does not emit close when the modal itself is clicked", async () => {
    const wrapper = mount(GameNoticeModal, {
      props: {
        success: true,
        message: "Mission completed",
        scoreGained: 100,
        goldGained: 50,
        livesLost: 0,
        livesRemaining: 3,
      },
    });

    await wrapper.get(".notice-modal").trigger("click");

    expect(wrapper.emitted("close")).toBeUndefined();
  });
});
