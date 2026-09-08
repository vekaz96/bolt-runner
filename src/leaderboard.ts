import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Difficulty } from "@game/bolt/difficulty";

/**
 * Leaderboard data layer.
 *
 * Design rules, all driven by this being an offline-first mobile game:
 *  - every call is wrapped; a network failure returns null/[] and never throws.
 *    Gameplay must never block on, or crash from, the network.
 *  - players are identified by Supabase *anonymous* auth — no email, no login.
 *  - a submission that can't reach the server is queued and retried on launch.
 */

const URL_ = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const KEY_ = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const leaderboardConfigured = Boolean(URL_?.trim() && KEY_?.trim());

const NICK_KEY = "bolt-nickname";
const PENDING_KEY = "bolt-pending-score";
const TABLE = "leaderboard";

export interface BoardRow {
  player_id: string;
  nickname: string;
  score: number;
  difficulty: Difficulty;
}

let client: SupabaseClient | null = null;
let authReady: Promise<string | null> | null = null;

function getClient(): SupabaseClient | null {
  if (!leaderboardConfigured) return null;
  if (!client) {
    client = createClient(URL_!.trim(), KEY_!.trim(), {
      auth: { persistSession: true, autoRefreshToken: true },
    });
  }
  return client;
}

/** Signs in anonymously once and caches the resulting player id. */
function ensureAuth(): Promise<string | null> {
  if (authReady) return authReady;

  authReady = (async () => {
    const sb = getClient();
    if (!sb) return null;
    try {
      const { data } = await sb.auth.getSession();
      if (data.session?.user?.id) return data.session.user.id;
      const { data: signed, error } = await sb.auth.signInAnonymously();
      if (error) return null;
      return signed.user?.id ?? null;
    } catch {
      return null;
    }
  })();

  return authReady;
}

// ── Nickname ────────────────────────────────────────────────────────

/** Deliberately small and blunt — enough to stop the obvious, not a filter service. */
const BLOCKLIST = [
  "fuck", "shit", "bitch", "cunt", "dick", "piss", "cock", "slut", "whore",
  "nigger", "nigga", "faggot", "rape", "nazi", "hitler", "penis", "vagina",
  "sex", "porn", "anal", "boob", "arse", "ass", "damn", "bastard",
];

export interface NickCheck {
  ok: boolean;
  reason?: string;
}

export function checkNickname(raw: string): NickCheck {
  const name = raw.trim();
  if (name.length < 2) return { ok: false, reason: "Too short — at least 2 letters." };
  if (name.length > 14) return { ok: false, reason: "Too long — 14 letters max." };
  if (!/^[\p{L}\p{N} _-]+$/u.test(name)) {
    return { ok: false, reason: "Letters, numbers, spaces and - _ only." };
  }
  const flat = name.toLowerCase().replace(/[\s_-]/g, "");
  if (BLOCKLIST.some(w => flat.includes(w))) {
    return { ok: false, reason: "Please pick a friendlier name." };
  }
  return { ok: true };
}

export function getNickname(): string | null {
  try {
    return localStorage.getItem(NICK_KEY);
  } catch {
    return null;
  }
}

export function setNickname(name: string) {
  try {
    localStorage.setItem(NICK_KEY, name.trim());
  } catch {
    /* ignore */
  }
}

// ── Submitting ──────────────────────────────────────────────────────

interface PendingScore {
  score: number;
  difficulty: Difficulty;
  nickname: string;
}

/**
 * Queue of scores stranded offline, at most one per board.
 *
 * This used to be a single slot that every new failure overwrote: play three runs
 * on a plane and only the last survived — and if the last was your worst, the good
 * one was gone. Keeping the best per difficulty is both correct and still bounded
 * (three entries maximum, one per board).
 */
function readPending(): PendingScore[] {
  try {
    const raw = localStorage.getItem(PENDING_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed as PendingScore[];
    // Migrate the old single-object format rather than discarding a queued score.
    if (parsed && typeof parsed === "object") return [parsed as PendingScore];
    return [];
  } catch {
    return [];
  }
}

function queuePending(entry: PendingScore) {
  const all = readPending();
  const i = all.findIndex(e => e.difficulty === entry.difficulty);
  if (i < 0) all.push(entry);
  else if (entry.score > all[i].score) all[i] = entry;
  else return; // an equal or better score for this board is already queued
  try {
    localStorage.setItem(PENDING_KEY, JSON.stringify(all));
  } catch {
    /* ignore */
  }
}

function removePending(entry: PendingScore) {
  const remaining = readPending().filter(e => e.difficulty !== entry.difficulty);
  try {
    if (remaining.length === 0) localStorage.removeItem(PENDING_KEY);
    else localStorage.setItem(PENDING_KEY, JSON.stringify(remaining));
  } catch {
    /* ignore */
  }
}


async function upsertScore(entry: PendingScore): Promise<boolean> {
  const sb = getClient();
  if (!sb) return false;
  const playerId = await ensureAuth();
  if (!playerId) return false;

  try {
    // Only overwrite when this run actually beats the stored one, so a weak
    // run can't demote a player's own best.
    const { data: existing } = await sb
      .from(TABLE)
      .select("score")
      .eq("player_id", playerId)
      .eq("difficulty", entry.difficulty)
      .maybeSingle();

    if (existing && existing.score >= entry.score) {
      // Still refresh the nickname if it changed.
      if (entry.nickname) {
        await sb
          .from(TABLE)
          .update({ nickname: entry.nickname })
          .eq("player_id", playerId)
          .eq("difficulty", entry.difficulty);
      }
      return true;
    }

    const { error } = await sb.from(TABLE).upsert(
      {
        player_id: playerId,
        nickname: entry.nickname,
        score: entry.score,
        difficulty: entry.difficulty,
      },
      { onConflict: "player_id,difficulty" },
    );
    return !error;
  } catch {
    return false;
  }
}

/**
 * Submit a finished run. Never throws. If it can't reach the server the score
 * is queued and retried by {@link flushPendingScore} on the next launch.
 */
export async function submitScore(score: number, difficulty: Difficulty): Promise<boolean> {
  const nickname = getNickname();
  if (!nickname || score <= 0) return false;

  const entry: PendingScore = { score, difficulty, nickname };
  const ok = await upsertScore(entry);
  // Only this board's queued entry is resolved — clearing the whole queue here
  // would silently drop scores waiting for the other difficulties.
  if (!ok) queuePending(entry);
  else removePending(entry);
  return ok;
}

/**
 * Retry every score stranded offline. Safe to call on every launch, and never
 * throws — a failed entry simply stays queued for next time.
 */
export async function flushPendingScore(): Promise<void> {
  for (const entry of readPending()) {
    const ok = await upsertScore(entry);
    if (ok) removePending(entry);
  }
}

// ── Reading ─────────────────────────────────────────────────────────

/** Top rows for one board. Returns [] rather than throwing when offline. */
export async function fetchBoard(difficulty: Difficulty, limit = 50): Promise<BoardRow[]> {
  const sb = getClient();
  if (!sb) return [];
  try {
    const { data, error } = await sb
      .from(TABLE)
      .select("player_id, nickname, score, difficulty")
      .eq("difficulty", difficulty)
      .order("score", { ascending: false })
      .limit(limit);
    if (error || !data) return [];
    return data as BoardRow[];
  } catch {
    return [];
  }
}

/** Current player's id, for highlighting their own row. */
export async function getPlayerId(): Promise<string | null> {
  return ensureAuth();
}
