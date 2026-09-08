/**
 * Typed boundary for the one heavy import we take from the sibling kidsvolt-web
 * repo.
 *
 * WHY THIS EXISTS
 * ---------------
 * `tsconfig.json` maps `@game/*` into `../kidsvolt-web/client/src/components/*`.
 * For the small modules (`bolt/difficulty`, `bolt/heroes`, `bolt/sfx`,
 * `bolt/nativeDevice`) that is cheap and gives real type safety — measured at
 * ~0.8 s.
 *
 * `@game/BoltGame3D` is different. It pulls three, @react-three/fiber and
 * @react-three/drei out of the *other* repo's 689-package pnpm store, and
 * resolving that symlink farm took tsc **9 minutes 30 seconds at 1 % CPU** — it is
 * syscall-bound on path resolution, not type-checking. That single import made
 * `pnpm check` unusable, which is the reason this project has never had CI.
 *
 * Declaring it here instead brings the whole check to ~2 s.
 *
 * THE TRADE-OFF — READ THIS
 * -------------------------
 * These props are a hand-maintained mirror of `BoltGame3DProps` in
 * kidsvolt-web/client/src/components/BoltGame3D.tsx. If the game adds or changes
 * a prop, TypeScript here will not notice on its own.
 *
 * `pnpm check:full` restores real resolution and validates this file against the
 * actual component. Run it whenever the game's API changes, and before a release.
 */

declare module "@game/BoltGame3D" {
  import type { ComponentType } from "react";
  import type { HeroId } from "@game/bolt/heroes";
  import type { Difficulty } from "@game/bolt/difficulty";

  /** Host-supplied URLs for a mobile DOM-overlay skin. Web callers omit this. */
  export interface BoltGameUiSkin {
    icons: Record<
      | "lightning"
      | "pause"
      | "play"
      | "arrow-left"
      | "arrow-right"
      | "arrow-up"
      | "profile"
      | "home"
      | "replay"
      | "crown",
      string
    >;
    surfaces: Record<
      "button-primary" | "button-secondary" | "panel-score" | "panel-personal-best",
      string
    >;
  }

  export interface BoltGame3DProps {
    onBackToMenu?: () => void;
    onBackToHeroSelect?: () => void;
    autoStart?: boolean;
    /** Capacitor / dedicated mobile app — always show touch controls, hide keyboard hints */
    standalone?: boolean;
    /** Edge-to-edge mobile layout — use with standalone */
    immersive?: boolean;
    onReadyChange?: (ready: boolean) => void;
    /** Fired when a run ends, with the final score (used by the mobile shell to bank ⚡). */
    onRunEnd?: (score: number) => void;
    /** Which hero to actually run as. Defaults to Bolt. */
    heroId?: HeroId;
    /** Easy / Medium / Hard. Falls back to the stored preference. */
    difficulty?: Difficulty;
    /** Title on the idle/start screen. The standalone app ships as "Bolt Runner". */
    title?: string;
    /** Host-supplied URLs for a mobile DOM-overlay skin. */
    uiSkin?: BoltGameUiSkin;
    /** Track theme. Structurally identical to the shell's own `MapId`. */
    mapId?: "classic" | "boulevard";
  }

  const BoltGame3D: ComponentType<BoltGame3DProps>;
  export default BoltGame3D;
}
