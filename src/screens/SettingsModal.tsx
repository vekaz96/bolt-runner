import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import GameButton from "../ui/GameButton";
import { gradients, colors, border, APP_VERSION } from "../theme";
import { hapticPress } from "../native";
import BoltIcon from "../ui/BoltIcon";
import type { BoltIconName } from "../ui/boltAssets";

const MUSIC_KEY = "bolt-music-muted";
const SFX_KEY = "bolt-sfx-muted";
const HAPTICS_OFF_KEY = "bolt-haptics-off";

interface SettingsModalProps {
  onClose: () => void;
}

/** A persisted on/off toggle row. `storedOn` maps "on" to a localStorage value. */
function ToggleRow({
  icon,
  offIcon,
  label,
  storageKey,
  /** value stored when the toggle is OFF */
  offValue,
}: {
  icon: BoltIconName;
  offIcon?: BoltIconName;
  label: string;
  storageKey: string;
  offValue: string;
}) {
  const [on, setOn] = useState(true);

  useEffect(() => {
    try {
      setOn(localStorage.getItem(storageKey) !== offValue);
    } catch {
      /* ignore */
    }
  }, [storageKey, offValue]);

  const toggle = () => {
    void hapticPress();
    setOn((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(storageKey, next ? "0" : offValue);
      } catch {
        /* ignore */
      }
      window.dispatchEvent(new CustomEvent("bolt-settings-changed"));
      return next;
    });
  };

  return (
    <div
      className="flex items-center gap-3 rounded-2xl px-4 py-3 mb-3"
      style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}
    >
      <BoltIcon name={on ? icon : offIcon ?? icon} size={28} />
      <span className="font-display font-semibold text-white text-base flex-1 text-left">
        {label}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label={label}
        onClick={toggle}
        className="relative w-12 h-7 rounded-full transition-colors"
        style={{ background: on ? colors.green : "rgba(255,255,255,0.2)" }}
      >
        <motion.span
          className="absolute top-1 w-5 h-5 rounded-full bg-white"
          animate={{ left: on ? 24 : 4 }}
          transition={{ type: "spring", stiffness: 600, damping: 32 }}
        />
      </button>
    </div>
  );
}

export default function SettingsModal({ onClose }: SettingsModalProps) {
  return (
    <motion.div
      className="absolute inset-0 z-30 flex items-center justify-center px-6"
      style={{ background: "rgba(0,0,0,0.72)" }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Settings"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="w-full max-w-sm rounded-3xl p-6"
        style={{ background: gradients.card, border: border.green }}
        onClick={(e) => e.stopPropagation()}
        initial={{ scale: 0.85, y: 20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.85, opacity: 0 }}
        transition={{ type: "spring", stiffness: 320, damping: 26 }}
      >
        <div className="flex items-center justify-center gap-2 mb-1">
          <BoltIcon name="settings" size={32} />
          <h2 className="font-display text-2xl font-bold text-white">Settings</h2>
        </div>
        <p className="text-sm text-white/60 text-center mb-6">Bolt Runner</p>

        <ToggleRow icon="music" label="Music" storageKey={MUSIC_KEY} offValue="1" />
        <ToggleRow icon="sound" offIcon="mute" label="Sound effects" storageKey={SFX_KEY} offValue="1" />
        <ToggleRow icon="vibration" label="Vibration" storageKey={HAPTICS_OFF_KEY} offValue="1" />

        <div className="mt-5 mb-5 text-center">
          <p className="text-xs text-white/45">Version {APP_VERSION}</p>
          <p className="text-xs text-white/45 inline-flex items-center gap-1">Made with <BoltIcon name="lightning" size={16} /> by KidsVolt</p>
        </div>

        <GameButton variant="primary" fullWidth onClick={onClose}>
          Done
        </GameButton>
      </motion.div>
    </motion.div>
  );
}
