import { beforeEach, describe, expect, it } from "vitest";
import { addBolts, getBalance, spendBolts } from "./wallet";

/**
 * The wallet is the only currency store in the game and it is entirely
 * client-side, so a silent rounding or clamping bug would quietly corrupt a
 * child's progress with nothing to catch it.
 */
describe("wallet", () => {
  beforeEach(() => localStorage.clear());

  it("starts empty", () => {
    expect(getBalance()).toBe(0);
  });

  it("accumulates earnings", () => {
    addBolts(30);
    addBolts(12);
    expect(getBalance()).toBe(42);
  });

  it("floors fractional awards rather than storing them", () => {
    addBolts(10.9);
    expect(getBalance()).toBe(10);
  });

  it("ignores negative awards instead of draining the wallet", () => {
    addBolts(50);
    addBolts(-20);
    expect(getBalance()).toBe(50);
  });

  it("spends only when affordable, and leaves the balance alone otherwise", () => {
    addBolts(100);
    expect(spendBolts(40)).toBe(true);
    expect(getBalance()).toBe(60);

    expect(spendBolts(61)).toBe(false);
    expect(getBalance()).toBe(60); // unchanged after a refused purchase
  });

  it("allows spending the exact balance", () => {
    addBolts(300);
    expect(spendBolts(300)).toBe(true);
    expect(getBalance()).toBe(0);
  });

  it("never reports a negative balance from corrupted storage", () => {
    localStorage.setItem("bolt-wallet", "-500");
    expect(getBalance()).toBe(0);
  });

  it("survives non-numeric storage", () => {
    localStorage.setItem("bolt-wallet", "not-a-number");
    expect(getBalance()).toBe(0);
  });
});
