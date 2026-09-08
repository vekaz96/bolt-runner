import { useCallback, useEffect, useState } from "react";
import { addBolts } from "../wallet";

const STREAK_KEY = "bolt-daily-streak";
const LAST_CLAIM_KEY = "bolt-daily-last-claim";
/** One forgiven miss per 7-day cycle — see `claim`. */
const GRACE_KEY = "bolt-daily-grace-used";

/**
 * How large a gap still continues the streak.
 *
 * 1 = claimed yesterday. 2 = missed exactly one day, which is forgiven once per
 * cycle: a 7-day streak that resets the first time a child is busy for a day is
 * punishing rather than motivating, and the reward curve (10 → 200 ⚡) only pays
 * off if reaching day 7 is realistic.
 */
const CONTINUE_GAP = 1;
const FORGIVEN_GAP = 2;

/** Reward value (in ⚡) for each day of a 7-day cycle. */
export const REWARDS = [10, 20, 30, 50, 75, 100, 200];

function todayKey(d = new Date()): string {
  // Local calendar day, e.g. "2026-06-28"
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function dayDiff(fromKey: string, toKey: string): number {
  const [fy, fm, fd] = fromKey.split("-").map(Number);
  const [ty, tm, td] = toKey.split("-").map(Number);
  const from = new Date(fy, fm - 1, fd).getTime();
  const to = new Date(ty, tm - 1, td).getTime();
  return Math.round((to - from) / 86_400_000);
}

interface DailyRewardState {
  /** 0-based index of the day the player is on (0–6). */
  dayIndex: number;
  /** Whether today's reward has already been claimed. */
  claimedToday: boolean;
  /** Claim today's reward; returns the amount won, or null if already claimed. */
  claim: () => number | null;
}

/**
 * Functional 7-day login streak persisted to localStorage.
 * - Same day  → already claimed, no change.
 * - Next day  → streak advances (wraps after day 7).
 * - Gap > 1   → streak resets to day 1.
 */
/** Does a gap of `gap` days keep the streak alive? */
export function continuesStreak(gap: number, graceUsed: boolean): boolean {
  if (gap === CONTINUE_GAP) return true;
  return gap === FORGIVEN_GAP && !graceUsed;
}

export function useDailyReward(): DailyRewardState {
  const [streak, setStreak] = useState(0);
  const [lastClaim, setLastClaim] = useState<string | null>(null);
  const [graceUsed, setGraceUsed] = useState(false);

  useEffect(() => {
    try {
      setStreak(Number(localStorage.getItem(STREAK_KEY) ?? "0"));
      setLastClaim(localStorage.getItem(LAST_CLAIM_KEY));
      setGraceUsed(localStorage.getItem(GRACE_KEY) === "1");
    } catch {
      /* ignore */
    }
  }, []);

  const today = todayKey();
  const claimedToday = lastClaim === today;

  // Determine which day the player is *on* right now.
  let dayIndex: number;
  if (!lastClaim) {
    dayIndex = 0;
  } else if (claimedToday) {
    dayIndex = (streak - 1 + 7) % 7;
  } else if (continuesStreak(dayDiff(lastClaim, today), graceUsed)) {
    dayIndex = streak % 7; // next reward in the cycle
  } else {
    dayIndex = 0; // missed too much → reset
  }

  const claim = useCallback((): number | null => {
    if (lastClaim === today) return null;

    const gap = lastClaim != null ? dayDiff(lastClaim, today) : Number.POSITIVE_INFINITY;
    const spendsGrace = gap === FORGIVEN_GAP && !graceUsed;
    const continued = lastClaim != null && continuesStreak(gap, graceUsed);
    const nextStreak = continued ? (streak % 7) + 1 : 1;
    const amount = REWARDS[(nextStreak - 1) % 7];
    // Starting a fresh cycle restores the forgiven miss, so the allowance is one
    // per cycle rather than one ever.
    const nextGrace = nextStreak === 1 ? false : graceUsed || spendsGrace;

    try {
      localStorage.setItem(STREAK_KEY, String(nextStreak));
      localStorage.setItem(LAST_CLAIM_KEY, today);
      localStorage.setItem(GRACE_KEY, nextGrace ? "1" : "0");
    } catch {
      /* ignore */
    }
    addBolts(amount);
    setStreak(nextStreak);
    setLastClaim(today);
    setGraceUsed(nextGrace);
    return amount;
  }, [lastClaim, streak, today, graceUsed]);

  return { dayIndex, claimedToday, claim };
}
