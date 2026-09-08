import { describe, expect, it } from "vitest";
import { REWARDS, continuesStreak } from "./useDailyReward";

/**
 * The 7-day streak decides how forgiving the reward loop feels, and its rules are
 * pure arithmetic that is easy to break silently — nothing else in the app would
 * fail if the grace day stopped working.
 */
describe("daily reward streak rules", () => {
  it("has a 7-day escalating cycle", () => {
    expect(REWARDS).toHaveLength(7);
    expect(REWARDS[0]).toBeLessThan(REWARDS[6]);
    // strictly increasing — a dip would make a later day feel like a punishment
    for (let i = 1; i < REWARDS.length; i++) {
      expect(REWARDS[i]).toBeGreaterThan(REWARDS[i - 1]);
    }
  });

  it("continues the streak when claimed on consecutive days", () => {
    expect(continuesStreak(1, false)).toBe(true);
    expect(continuesStreak(1, true)).toBe(true); // never consumes the allowance
  });

  it("forgives exactly one missed day per cycle", () => {
    expect(continuesStreak(2, false)).toBe(true);
    expect(continuesStreak(2, true)).toBe(false); // allowance already spent
  });

  it("breaks the streak after two or more missed days", () => {
    expect(continuesStreak(3, false)).toBe(false);
    expect(continuesStreak(7, false)).toBe(false);
  });

  it("does not treat a same-day or backwards gap as continuing", () => {
    // a clock moved backwards must not hand out a free continuation
    expect(continuesStreak(0, false)).toBe(false);
    expect(continuesStreak(-1, false)).toBe(false);
  });
});
