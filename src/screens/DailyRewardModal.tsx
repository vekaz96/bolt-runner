import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import GameButton from "../ui/GameButton";
import { gradients, colors, border } from "../theme";
import { hapticSuccess } from "../native";
import { useDailyReward, REWARDS } from "./useDailyReward";
import BoltIcon from "../ui/BoltIcon";
import BoltSurface from "../ui/BoltSurface";

interface DailyRewardModalProps {
  onClose: () => void;
}

export default function DailyRewardModal({ onClose }: DailyRewardModalProps) {
  const { dayIndex, claimedToday, claim } = useDailyReward();
  const [justClaimed, setJustClaimed] = useState<number | null>(null);

  const handleClaim = () => {
    const amount = claim();
    if (amount != null) {
      setJustClaimed(amount);
      void hapticSuccess();
    }
  };

  const alreadyDone = claimedToday || justClaimed != null;

  return (
    <motion.div
      className="absolute inset-0 z-30 flex items-center justify-center px-6"
      style={{ background: "rgba(0,0,0,0.72)" }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Daily rewards"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="w-full max-w-sm rounded-3xl p-6 text-center"
        style={{ background: gradients.card, border: border.green }}
        onClick={(e) => e.stopPropagation()}
        initial={{ scale: 0.8, y: 20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ type: "spring", stiffness: 320, damping: 26 }}
      >
        <BoltSurface name={alreadyDone ? "panel-reward-claimed" : "panel-daily-reward"} className="w-full min-h-[96px] mb-1 pl-[76px] pr-5">
          <h2 className="font-display text-2xl font-bold text-white">Daily Reward</h2>
        </BoltSurface>
        <p className="text-sm text-white/70 mb-5">
          {alreadyDone ? <span className="inline-flex items-center gap-1">See you tomorrow for more! <BoltIcon name="gift" size={20} /></span> : "Claim your reward and keep the streak!"}
        </p>

        {/* 7-day grid */}
        <div className="grid grid-cols-4 gap-2.5 mb-6">
          {REWARDS.map((amount, i) => {
            const claimed = i < dayIndex || (alreadyDone && i === dayIndex);
            const isToday = i === dayIndex && !alreadyDone;
            return (
              <motion.div
                key={i}
                className="relative rounded-2xl py-2.5 flex flex-col items-center justify-center"
                style={{
                  background: isToday
                    ? gradients.greenButton
                    : claimed
                      ? "rgba(74,222,128,0.18)"
                      : "rgba(255,255,255,0.08)",
                  border: isToday
                    ? `2px solid ${colors.gold}`
                    : "1px solid rgba(255,255,255,0.12)",
                  boxShadow: isToday ? "0 0 16px rgba(253,224,71,0.45)" : undefined,
                }}
                animate={isToday ? { scale: [1, 1.06, 1] } : { scale: 1 }}
                transition={isToday ? { duration: 1.4, repeat: Infinity } : undefined}
              >
                <span
                  className="text-[10px] font-bold uppercase tracking-wide"
                  style={{ color: isToday ? colors.ink : "rgba(255,255,255,0.55)" }}
                >
                  Day {i + 1}
                </span>
                <div className="flex items-center gap-0.5">
                  <BoltIcon name="lightning" size={17} />
                  <span
                    className="font-display text-sm font-bold"
                    style={{ color: isToday ? colors.ink : "#fff" }}
                  >
                    {amount}
                  </span>
                </div>
                {claimed && (
                  <span
                    className="absolute -top-1.5 -right-1.5 rounded-full p-0.5"
                    style={{ background: colors.green }}
                  >
                    <BoltIcon name="check" size={17} />
                  </span>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Claim feedback */}
        <AnimatePresence>
          {justClaimed != null && (
            <motion.p
              className="font-display text-lg font-bold mb-4"
              style={{ color: colors.gold }}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <span className="inline-flex items-center justify-center gap-1"><BoltIcon name="star" size={24} /> +{justClaimed} <BoltIcon name="lightning" size={22} /> collected!</span>
            </motion.p>
          )}
        </AnimatePresence>

        {alreadyDone ? (
          <GameButton variant="secondary" fullWidth onClick={onClose}>
            <span className="inline-flex items-center gap-2"><BoltIcon name="close" size={25} />Close</span>
          </GameButton>
        ) : (
          <GameButton variant="primary" fullWidth onClick={handleClaim}>
            <span className="inline-flex items-center gap-2">Claim reward <BoltIcon name="gift" size={28} /></span>
          </GameButton>
        )}
      </motion.div>
    </motion.div>
  );
}
