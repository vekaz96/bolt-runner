import { motion } from "framer-motion";
import type { ReactNode, CSSProperties } from "react";
import { playSfx } from "@game/bolt/sfx";
import BoltSurface from "./BoltSurface";
import { hapticPress } from "../native";

type Variant = "primary" | "gold" | "secondary";

interface GameButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: Variant;
  className?: string;
  style?: CSSProperties;
  ariaLabel?: string;
  fullWidth?: boolean;
}

const surfaceByVariant = { primary: "button-primary", gold: "button-action", secondary: "button-secondary" } as const;
const textColor: Record<Variant, string> = { primary: "#052e16", gold: "#052e16", secondary: "#fff" };

/**
 * One reusable, juicy button for the shell: tap-scale animation via
 * framer-motion plus light haptic feedback on native. Replaces the repeated
 * inline button styling across Settings / DailyReward / GameShell.
 */
export default function GameButton({
  children,
  onClick,
  variant = "primary",
  className = "",
  style,
  ariaLabel,
  fullWidth,
}: GameButtonProps) {
  return (
    <motion.button
      type="button"
      aria-label={ariaLabel}
      onClick={() => {
        void hapticPress();
        playSfx("click");
        onClick?.();
      }}
      whileTap={{ scale: 0.95 }}
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      className={`relative min-h-11 font-display font-bold text-lg select-none ${
        fullWidth ? "w-full" : ""
      } ${className}`}
      style={{ color: textColor[variant], ...style }}
    >
      <BoltSurface name={surfaceByVariant[variant]} className="w-full min-h-[76px] px-10 py-4">
        {children}
      </BoltSurface>
    </motion.button>
  );
}
