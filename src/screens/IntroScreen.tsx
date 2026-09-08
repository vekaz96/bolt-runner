import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import introBg from "../../mobile-game-assests/Intro-of-the-game.png";
import DailyRewardModal from "./DailyRewardModal";
import SettingsModal from "./SettingsModal";
import WalletPill from "../ui/WalletPill";
import BoltIcon from "../ui/BoltIcon";
import BoltSurface from "../ui/BoltSurface";
import { hapticPress } from "../native";

interface IntroScreenProps {
  onPlay: () => void;
  onLeaderboard?: () => void;
  onReady?: () => void;
}

/** A few floating ambient bolts/stars drifting behind the UI for life. */
const AMBIENT = [
  { icon: "lightning" as const, left: "12%", top: "26%", size: 28, delay: 0 },
  { icon: "star" as const, left: "82%", top: "34%", size: 24, delay: 0.8 },
  { icon: "star" as const, left: "24%", top: "60%", size: 20, delay: 1.6 },
  { icon: "lightning" as const, left: "70%", top: "64%", size: 24, delay: 2.2 },
];

export default function IntroScreen({ onPlay, onLeaderboard, onReady }: IntroScreenProps) {
  const [showDaily, setShowDaily] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    onReady?.();
  }, [onReady]);

  const handlePlay = () => {
    void hapticPress();
    onPlay();
  };

  return (
    <div className="immersive-root relative overflow-hidden bg-black">
      {/* Background art — gentle fade + scale-in */}
      <motion.img
        src={introBg}
        alt=""
        className="absolute inset-0 h-full w-full object-cover object-center"
        draggable={false}
        initial={{ opacity: 0, scale: 1.08 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.1, ease: "easeOut" }}
      />

      {/* Wallet balance + leaderboard */}
      <div
        className="absolute z-20 left-0 right-0 flex justify-center items-center gap-2"
        style={{ top: "max(14px, env(safe-area-inset-top))" }}
      >
        <WalletPill />
        {onLeaderboard && (
          <motion.button
            type="button"
            onClick={() => {
              void hapticPress();
              onLeaderboard();
            }}
            whileTap={{ scale: 0.9 }}
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{
              background: "rgba(0,0,0,0.5)",
              border: "1px solid rgba(253,224,71,0.4)",
              backdropFilter: "blur(8px)",
            }}
            aria-label="Leaderboard"
          >
            <BoltIcon name="trophy" size={25} />
          </motion.button>
        )}
      </div>

      {/* Floating ambient particles */}
      {AMBIENT.map((p, i) => (
        <motion.span
          key={i}
          className="absolute z-10 pointer-events-none select-none"
          style={{ left: p.left, top: p.top }}
          animate={{ y: [0, -16, 0], rotate: [0, 8, -8, 0], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 4, repeat: Infinity, delay: p.delay, ease: "easeInOut" }}
        >
          <BoltIcon name={p.icon} size={p.size} />
        </motion.span>
      ))}

      {/* Bottom action area: utilities row on top, big Play below */}
      <div
        className="absolute z-20 left-0 right-0 flex flex-col items-center gap-4 px-6"
        style={{ bottom: "max(24px, env(safe-area-inset-bottom))" }}
      >
        {/* Utility row: Daily (left) + Settings (right) */}
        <div className="w-full max-w-sm flex items-end justify-between">
          <motion.button
            type="button"
            onClick={() => {
              void hapticPress();
              setShowDaily(true);
            }}
            aria-label="Daily rewards"
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.45, type: "spring", stiffness: 240, damping: 20 }}
            whileTap={{ scale: 0.9 }}
          >
            <span className="flex flex-col items-center text-white font-display text-xs font-bold drop-shadow-lg">
              <BoltIcon name="gift" size={58} />Daily rewards
            </span>
          </motion.button>

          <motion.button
            type="button"
            onClick={() => {
              void hapticPress();
              setShowSettings(true);
            }}
            aria-label="Settings"
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.45, type: "spring", stiffness: 240, damping: 20 }}
            whileTap={{ scale: 0.9 }}
          >
            <span className="flex flex-col items-center text-white font-display text-xs font-bold drop-shadow-lg">
              <BoltIcon name="settings" size={54} />Settings
            </span>
          </motion.button>
        </div>

        {/* Primary action: Play */}
        <motion.button
          type="button"
          onClick={handlePlay}
          aria-label="Play"
          className="w-[80%] max-w-[320px] min-h-11"
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.65, type: "spring", stiffness: 220, damping: 18 }}
          whileTap={{ scale: 0.96 }}
        >
          <motion.span className="block w-full drop-shadow-2xl"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut", delay: 1.2 }}
          >
            <BoltSurface name="button-primary" className="w-full min-h-[90px] px-12 py-5 font-display text-2xl font-bold text-[#052e16]">
              <BoltIcon name="play" size={32} /> <span className="ml-2">Play</span>
            </BoltSurface>
          </motion.span>
        </motion.button>
      </div>

      <AnimatePresence>
        {showDaily && <DailyRewardModal key="daily" onClose={() => setShowDaily(false)} />}
        {showSettings && <SettingsModal key="settings" onClose={() => setShowSettings(false)} />}
      </AnimatePresence>
    </div>
  );
}
