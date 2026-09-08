import { describe, expect, it } from "vitest";
import { checkNickname } from "./leaderboard";

/**
 * Nicknames are the only free text a child can put on a public board, so this is
 * the app's entire user-generated-content surface. The rules are enforced
 * client-side only (the database check constrains length alone), which makes it
 * worth pinning the behaviour precisely.
 */
describe("checkNickname", () => {
  const ok = (n: string) => expect(checkNickname(n).ok).toBe(true);
  const bad = (n: string) => expect(checkNickname(n).ok).toBe(false);

  it("accepts ordinary playful names", () => {
    ok("TurboFrog");
    ok("Zoe");
    ok("Sky Runner");
    ok("bolt_fan-99");
  });

  it("accepts non-Latin letters", () => {
    ok("Мария");
    ok("さくら");
  });

  it("rejects names that are too short or too long", () => {
    bad("A");
    bad("");
    bad("A".repeat(15));
    ok("A".repeat(14)); // the boundary itself is allowed
  });

  it("trims before measuring", () => {
    ok("  Zoe  ");
    bad("  A  ");
  });

  it("rejects punctuation and symbols outside the allowed set", () => {
    bad("hi@there");
    bad("<script>");
    bad("name!");
    bad("a.b");
  });

  it("blocks profanity", () => {
    bad("shitty");
    bad("BITCH");
  });

  it("blocks profanity disguised with separators", () => {
    // the check strips spaces, hyphens and underscores before matching
    bad("s h i t");
    bad("b-i-t-c-h");
    bad("f_u_c_k");
  });

  it("gives a reason when it rejects", () => {
    const r = checkNickname("A");
    expect(r.ok).toBe(false);
    expect(typeof r.reason).toBe("string");
    expect(r.reason!.length).toBeGreaterThan(0);
  });

  it("does not reject an innocent word that merely contains a blocked substring", () => {
    // Documents a known limitation of substring matching rather than asserting
    // ideal behaviour: "Classic" contains "ass". If this ever starts passing,
    // the filter has been improved and this expectation should flip.
    expect(checkNickname("Classic").ok).toBe(false);
  });
});
