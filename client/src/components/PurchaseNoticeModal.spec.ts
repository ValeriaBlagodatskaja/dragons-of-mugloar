import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";

import PurchaseNoticeModal from "./PurchaseNoticeModal.vue";

describe("PurchaseNoticeModal", () => {
  it("shows a healing purchase result", () => {
    const wrapper = mount(PurchaseNoticeModal, {
      props: {
        itemName: "Healing potion",
        goldSpent: 50,
        livesGained: 1,
        levelsGained: 0,
      },
    });

    expect(wrapper.get(".notice-modal").classes()).toContain("notice-success");
    expect(wrapper.get(".notice-icon").text()).toBe("✓");
    expect(wrapper.get(".notice-eyebrow").text()).toBe("Purchase Complete");

    expect(wrapper.text()).toContain("Healing potion");
    expect(wrapper.text()).toContain("Your dragon has recovered.");
    expect(wrapper.text()).toContain("−50 gold");
    expect(wrapper.text()).toContain("+1 life");
  });

  it("shows an upgrade purchase result", () => {
    const wrapper = mount(PurchaseNoticeModal, {
      props: {
        itemName: "Claw Sharpening",
        goldSpent: 100,
        livesGained: 0,
        levelsGained: 1,
      },
    });

    expect(wrapper.text()).toContain("Claw Sharpening");
    expect(wrapper.text()).toContain("Your dragon has been upgraded.");
    expect(wrapper.text()).toContain("−100 gold");
    expect(wrapper.text()).toContain("+1 level");

    expect(wrapper.text()).not.toContain("life");
  });

  it("uses plural text for multiple lives and levels", () => {
    const wrapper = mount(PurchaseNoticeModal, {
      props: {
        itemName: "Powerful upgrade",
        goldSpent: 200,
        livesGained: 2,
        levelsGained: 3,
      },
    });

    expect(wrapper.text()).toContain("+2 lives");
    expect(wrapper.text()).toContain("+3 levels");
  });

  it("does not show reward values when they are zero", () => {
    const wrapper = mount(PurchaseNoticeModal, {
      props: {
        itemName: "Free upgrade",
        goldSpent: 0,
        livesGained: 0,
        levelsGained: 0,
      },
    });

    const rewards = wrapper.get(".notice-rewards");

    expect(rewards.findAll("span")).toHaveLength(0);
  });

  it("emits close when Continue is clicked", async () => {
    const wrapper = mount(PurchaseNoticeModal, {
      props: {
        itemName: "Healing potion",
        goldSpent: 50,
        livesGained: 1,
        levelsGained: 0,
      },
    });

    await wrapper.get("button").trigger("click");

    expect(wrapper.emitted("close")).toHaveLength(1);
  });

  it("emits close when the backdrop is clicked", async () => {
    const wrapper = mount(PurchaseNoticeModal, {
      props: {
        itemName: "Healing potion",
        goldSpent: 50,
        livesGained: 1,
        levelsGained: 0,
      },
    });

    await wrapper.get(".notice-backdrop").trigger("click");

    expect(wrapper.emitted("close")).toHaveLength(1);
  });

  it("does not emit close when the modal itself is clicked", async () => {
    const wrapper = mount(PurchaseNoticeModal, {
      props: {
        itemName: "Healing potion",
        goldSpent: 50,
        livesGained: 1,
        levelsGained: 0,
      },
    });

    await wrapper.get(".notice-modal").trigger("click");

    expect(wrapper.emitted("close")).toBeUndefined();
  });
});
