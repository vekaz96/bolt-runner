import { beforeEach, describe, expect, it } from "vitest";
import { HERO_PRICES, purchaseHero } from "./heroUnlocks";
import { addBolts, getBalance } from "./wallet";

/**
 * Regression cover for P0.4.
 *
 * `byte` and `pip` were purchasable at 500 and 800 ⚡ but had no playable rig —
 * `getHeroRig` returns null for them, so a child could spend their whole wallet
 * and receive Bolt with a different emoji. These tests exist to make sure that
 * cannot come back silently when the roster changes.
 */
describe("hero unlocks", () => {
  beforeEach(() => localStorage.clear());

  it("only sells heroes that have a real rig", () => {
    expect(HERO_PRICES.luna).toBe(300);
    expect(HERO_PRICES.byte).toBeUndefined();
    expect(HERO_PRICES.pip).toBeUndefined();
  });

  it("refuses to sell a hero with no price, and takes no money for it", () => {
    addBolts(5000);
    expect(purchaseHero("byte")).toBe(false);
    expect(purchaseHero("pip")).toBe(false);
    expect(getBalance()).toBe(5000);
  });

  it("buys a priced hero and deducts exactly the price", () => {
    addBolts(500);
    expect(purchaseHero("luna")).toBe(true);
    expect(getBalance()).toBe(200);
  });

  it("refuses when the player cannot afford it", () => {
    addBolts(299);
    expect(purchaseHero("luna")).toBe(false);
    expect(getBalance()).toBe(299);
  });

  it("does not charge twice for a hero already owned", () => {
    addBolts(700);
    expect(purchaseHero("luna")).toBe(true);
    expect(getBalance()).toBe(400);

    expect(purchaseHero("luna")).toBe(true); // already owned
    expect(getBalance()).toBe(400); // and still not charged again
  });

  it("persists ownership across a reload", () => {
    addBolts(300);
    purchaseHero("luna");
    const stored = JSON.parse(localStorage.getItem("bolt-heroes-unlocked") ?? "[]");
    expect(stored).toContain("luna");
  });
});
