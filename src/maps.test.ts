import { beforeEach, describe, expect, it, vi } from "vitest";
import { getStoredMap, setStoredMap } from "./maps";

describe("saved map preference", () => {
  beforeEach(() => localStorage.clear());

  it.each([null, "", "unknown", '"boulevard"', "Boulevard"])(
    "keeps the existing map for a missing or invalid stored value (%s)",
    (saved) => {
      if (saved !== null) localStorage.setItem("bolt-map", saved);
      expect(getStoredMap()).toBe("classic");
    },
  );

  it("remembers either map without changing other preferences", () => {
    localStorage.setItem("bolt-difficulty", "hard");
    setStoredMap("boulevard");
    expect(getStoredMap()).toBe("boulevard");
    setStoredMap("classic");
    expect(getStoredMap()).toBe("classic");
    expect(localStorage.getItem("bolt-difficulty")).toBe("hard");
  });

  it("falls back safely when storage reads are blocked", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new DOMException("Storage unavailable", "SecurityError");
    });
    expect(getStoredMap()).toBe("classic");
  });

  it("does not interrupt navigation when storage writes fail", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("Storage full", "QuotaExceededError");
    });
    expect(() => setStoredMap("boulevard")).not.toThrow();
  });
});
