import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DIFFICULTIES, getStoredDifficulty, type Difficulty } from "@game/bolt/difficulty";
import {
  fetchBoard,
  getNickname,
  getPlayerId,
  leaderboardConfigured,
  type BoardRow,
} from "../leaderboard";
import NicknameModal from "./NicknameModal";
import { colors, gradients } from "../theme";
import { hapticPress } from "../native";
import BoltIcon from "../ui/BoltIcon";

interface LeaderboardScreenProps {
  onBack: () => void;
}

const ORDER: Difficulty[] = ["easy", "medium", "hard"];
const TINT: Record<Difficulty, string> = {
  easy: "#4ade80",
  medium: "#fde047",
  hard: "#f87171",
};
/** Podium colours for the top three. */
const MEDAL = ["#fde047", "#cbd5e1", "#d97706"];

export default function LeaderboardScreen({ onBack }: LeaderboardScreenProps) {
  const [difficulty, setDifficulty] = useState<Difficulty>(getStoredDifficulty);
  const [rows, setRows] = useState<BoardRow[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [nickname, setNick] = useState<string | null>(getNickname());
  const [editing, setEditing] = useState(false);

  const load = useCallback(async (d: Difficulty) => {
    setRows(null);
    setFailed(false);
    if (!leaderboardConfigured) {
      setFailed(true);
      return;
    }
    const [board, id] = await Promise.all([fetchBoard(d), getPlayerId()]);
    setPlayerId(id);
    if (board.length === 0 && !id) setFailed(true);
    setRows(board);
  }, []);

  useEffect(() => {
    void load(difficulty);
  }, [difficulty, load]);

  const myIndex = rows?.findIndex(r => r.player_id === playerId) ?? -1;

  return (
    <div
      className="flex flex-col h-full w-full overflow-hidden"
      style={{ background: gradients.forest }}
    >
      <div
        className="relative z-10 flex flex-col flex-1 min-h-0 w-full max-w-md mx-auto px-5"
        style={{
          paddingTop: "max(16px, env(safe-area-inset-top))",
          paddingBottom: "max(16px, env(safe-area-inset-bottom))",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-2 shrink-0">
          <motion.button
            type="button"
            onClick={() => {
              void hapticPress();
              onBack();
            }}
            whileTap={{ scale: 0.9 }}
            className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
            style={{
              background: "rgba(0,0,0,0.45)",
              border: "1px solid rgba(255,255,255,0.2)",
            }}
            aria-label="Back to main menu"
          >
            <BoltIcon name="arrow-left" size={27} />
          </motion.button>

          <div className="flex items-center gap-2">
            <BoltIcon name="trophy" size={28} />
            <h1 className="font-display text-xl font-bold text-white">Leaderboard</h1>
          </div>

          <motion.button
            type="button"
            onClick={() => {
              void hapticPress();
              setEditing(true);
            }}
            whileTap={{ scale: 0.9 }}
            className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
            style={{
              background: "rgba(0,0,0,0.45)",
              border: "1px solid rgba(255,255,255,0.2)",
            }}
            aria-label="Change your name"
          >
            <BoltIcon name="edit" size={25} />
          </motion.button>
        </div>

        {/* Difficulty tabs */}
        <div
          className="flex gap-1 p-1 rounded-2xl shrink-0 mb-3"
          style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.14)" }}
          role="tablist"
        >
          {ORDER.map(d => {
            const active = d === difficulty;
            return (
              <motion.button
                key={d}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => {
                  void hapticPress();
                  setDifficulty(d);
                }}
                whileTap={{ scale: 0.95 }}
                className="flex-1 rounded-xl py-2 font-display text-sm font-bold"
                style={{
                  background: active ? `${TINT[d]}26` : "transparent",
                  border: active ? `1.5px solid ${TINT[d]}` : "1.5px solid transparent",
                  color: active ? TINT[d] : "rgba(255,255,255,0.6)",
                }}
              >
                {DIFFICULTIES[d].label}
              </motion.button>
            );
          })}
        </div>

        {/* Board */}
        <div className="flex-1 min-h-0 overflow-y-auto rounded-2xl"
          style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)" }}
        >
          {rows === null && !failed && (
            <p className="text-center text-white/60 text-sm py-10">Loading…</p>
          )}

          {failed && (
            <div className="flex flex-col items-center justify-center py-10 px-6 text-center">
              <BoltIcon name="offline" size={44} className="mb-2" />
              <p className="font-display text-white/80 font-semibold">
                Can't reach the leaderboard
              </p>
              <p className="text-xs text-white/50 mt-1">
                Your scores are still saved on this device.
              </p>
            </div>
          )}

          {rows !== null && !failed && rows.length === 0 && (
            <div className="flex flex-col items-center justify-center py-10 px-6 text-center">
              <BoltIcon name="crown" size={44} className="mb-2" />
              <p className="font-display text-white/80 font-semibold">No scores yet</p>
              <p className="text-xs text-white/50 mt-1">Be the first on this board!</p>
            </div>
          )}

          {rows?.map((row, i) => {
            const isMe = row.player_id === playerId;
            const medal = i < 3 ? MEDAL[i] : undefined;
            return (
              <div
                key={`${row.player_id}-${row.difficulty}`}
                className="flex items-center gap-3 px-3 py-2.5"
                style={{
                  background: isMe ? "rgba(74,222,128,0.16)" : undefined,
                  borderBottom: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <span
                  className="w-7 text-center font-display font-bold text-sm tabular-nums"
                  style={{ color: medal ?? "rgba(255,255,255,0.5)" }}
                >
                  {i + 1}
                </span>
                <span className="flex-1 truncate font-display font-semibold text-white text-sm">
                  {row.nickname}
                  {isMe && (
                    <span className="ml-1.5 text-[10px] font-bold" style={{ color: colors.lime }}>
                      YOU
                    </span>
                  )}
                </span>
                <span
                  className="font-display font-bold tabular-nums text-sm"
                  style={{ color: TINT[difficulty] }}
                >
                  {row.score.toLocaleString()}
                </span>
              </div>
            );
          })}
        </div>

        {/* Own standing */}
        <p className="text-center text-xs text-white/50 mt-2 shrink-0">
          {nickname
            ? myIndex >= 0
              ? `You're #${myIndex + 1} on ${DIFFICULTIES[difficulty].label}`
              : `Playing as ${nickname} — no score here yet`
            : "Set a name to join the leaderboard"}
        </p>
      </div>

      <AnimatePresence>
        {editing && (
          <NicknameModal
            key="nick"
            onSaved={name => {
              setNick(name);
              setEditing(false);
              void load(difficulty);
            }}
            onClose={() => setEditing(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
