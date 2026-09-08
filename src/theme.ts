/**
 * Shared design tokens for the Bolt Runner mobile shell.
 *
 * These mirror the green/gold palette already used across the app (and the
 * sibling kidsvolt-web game), centralised so every shell screen pulls from one
 * source instead of repeating inline hex codes.
 */

export const colors = {
  forestDark: "#052e16",
  forest: "#14532d",
  forestMid: "#166534",
  lime: "#4ade80",
  green: "#22c55e",
  greenDeep: "#15803d",
  emerald: "#16a34a",
  gold: "#fde047",
  amber: "#ca8a04",
  danger: "#f87171",
  ink: "#0a0f0a",
} as const;

export const gradients = {
  /** Vertical forest backdrop used by loaders / menus. */
  forest: `linear-gradient(180deg, ${colors.forestDark} 0%, ${colors.forest} 50%, ${colors.forestMid} 100%)`,
  /** Primary "go" button (green). */
  greenButton: `linear-gradient(135deg, ${colors.lime}, ${colors.green})`,
  /** Secondary accent button (gold). */
  goldButton: `linear-gradient(135deg, ${colors.gold}, ${colors.amber})`,
  /** Frosted card surface over the forest backdrop. */
  card: `linear-gradient(180deg, ${colors.forest} 0%, ${colors.forestDark} 100%)`,
} as const;

export const glow = {
  green: `0 0 24px rgba(74, 222, 128, 0.5)`,
  gold: `0 0 24px rgba(253, 224, 71, 0.5)`,
  soft: `0 8px 30px rgba(0, 0, 0, 0.45)`,
} as const;

export const border = {
  green: `1px solid rgba(74, 222, 128, 0.35)`,
  subtle: `1px solid rgba(255, 255, 255, 0.18)`,
} as const;

/** App version surfaced in Settings. Keep in sync with package.json. */
export const APP_VERSION = "1.0.0";
