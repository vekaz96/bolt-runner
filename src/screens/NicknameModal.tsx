import { useState } from "react";
import { motion } from "framer-motion";
import GameButton from "../ui/GameButton";
import { gradients, colors, border } from "../theme";
import { checkNickname, getNickname, setNickname } from "../leaderboard";
import BoltIcon from "../ui/BoltIcon";

interface NicknameModalProps {
  onSaved: (name: string) => void;
  onClose: () => void;
}

/** Asks for a leaderboard display name. Deliberately steers away from real names. */
export default function NicknameModal({ onSaved, onClose }: NicknameModalProps) {
  const [value, setValue] = useState(getNickname() ?? "");
  const [error, setError] = useState<string | null>(null);

  const save = () => {
    const result = checkNickname(value);
    if (!result.ok) {
      setError(result.reason ?? "Please pick another name.");
      return;
    }
    const clean = value.trim();
    setNickname(clean);
    onSaved(clean);
  };

  return (
    <motion.div
      className="absolute inset-0 z-40 flex items-center justify-center px-6"
      style={{ background: "rgba(0,0,0,0.75)" }}
      role="dialog"
      aria-modal="true"
      aria-label="Choose a leaderboard name"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="w-full max-w-sm rounded-3xl p-6 text-center"
        style={{ background: gradients.card, border: border.green }}
        initial={{ scale: 0.85, y: 20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.85, opacity: 0 }}
        transition={{ type: "spring", stiffness: 320, damping: 26 }}
      >
        <div className="flex items-center justify-center gap-2 mb-1">
          <BoltIcon name="profile" size={32} />
          <h2 className="font-display text-2xl font-bold text-white">Your name</h2>
        </div>
        <p className="text-sm text-white/70 mb-4">Pick a name for the leaderboard.</p>

        <input
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setError(null);
          }}
          maxLength={14}
          autoCapitalize="words"
          autoCorrect="off"
          spellCheck={false}
          placeholder="e.g. TurboFrog"
          className="w-full rounded-2xl px-4 py-3 text-center font-display text-lg font-bold text-white outline-none"
          style={{
            background: "rgba(255,255,255,0.1)",
            border: error ? `2px solid ${colors.danger}` : "2px solid rgba(255,255,255,0.2)",
          }}
          aria-label="Nickname"
        />

        <div className="flex items-start gap-1.5 mt-2 mb-1 text-left">
          <BoltIcon name="shield" size={22} className="shrink-0 mt-0.5" />
          <p className="text-[11px] text-white/60 leading-snug">
            Please don't use your real name — pick a fun nickname instead.
          </p>
        </div>

        <p
          className="text-xs font-semibold mb-4 min-h-4"
          style={{ color: error ? colors.danger : "transparent" }}
        >
          {error ?? "."}
        </p>

        <div className="flex flex-col gap-2.5">
          <GameButton variant="primary" fullWidth onClick={save}>
            Save
          </GameButton>
          <GameButton variant="secondary" fullWidth onClick={onClose}>
            <span className="inline-flex items-center gap-2"><BoltIcon name="close" size={24} />Not now</span>
          </GameButton>
        </div>
      </motion.div>
    </motion.div>
  );
}
