import type { ReactNode } from "react";

interface GameShellProps {
  onMainMenu: () => void;
  children: ReactNode;
}

/**
 * Plain passthrough around the game. The game renders its own chrome (pause
 * button + pause menu with Quit/Change Hero), so the shell adds no overlay —
 * a second "Menu" pill here would double up with the in-game HUD.
 */
export default function GameShell({ children }: GameShellProps) {
  return <>{children}</>;
}
