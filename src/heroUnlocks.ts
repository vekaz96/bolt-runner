import { useCallback, useEffect, useState } from "react";
import type { HeroId } from "@game/bolt/heroes";
import { spendBolts } from "./wallet";

const UNLOCKS_KEY = "bolt-heroes-unlocked";
const UNLOCKS_EVENT = "bolt-heroes-changed";

/**
 * ⚡ price per locked hero. Bolt is free/unlocked in heroes.ts.
 *
 * Only heroes with a real playable rig may appear here. `byte` and `pip` are
 * marked `comingSoon` and have no rig — `getHeroRig` returns null for them, so
 * buying one used to spend the player's whole wallet and hand back Bolt with a
 * different emoji. Add them back alongside their models, not before.
 */
export const HERO_PRICES: Partial<Record<HeroId, number>> = {
  luna: 300,
  rex: 400,
};

function readUnlocks(): Set<string> {
  try {
    const raw = JSON.parse(localStorage.getItem(UNLOCKS_KEY) ?? "[]");
    return new Set(Array.isArray(raw) ? raw.filter((v) => typeof v === "string") : []);
  } catch {
    return new Set();
  }
}

/** Attempts the purchase; deducts ⚡ and persists on success. */
export function purchaseHero(id: HeroId): boolean {
  const price = HERO_PRICES[id];
  if (price == null) return false;
  const owned = readUnlocks();
  if (owned.has(id)) return true;
  if (!spendBolts(price)) return false;

  owned.add(id);
  try {
    localStorage.setItem(UNLOCKS_KEY, JSON.stringify([...owned]));
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new CustomEvent(UNLOCKS_EVENT));
  return true;
}

/** Live set of purchased hero ids (on top of statically unlocked heroes). */
export function useHeroUnlocks(): Set<string> {
  const [owned, setOwned] = useState(readUnlocks);
  const refresh = useCallback(() => setOwned(readUnlocks()), []);

  useEffect(() => {
    window.addEventListener(UNLOCKS_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(UNLOCKS_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [refresh]);

  return owned;
}
