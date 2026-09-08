import { act, createElement, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { BoltGame3DProps } from "@game/BoltGame3D";
import App from "./App";

const shell = vi.hoisted(() => ({
  nativeBack: undefined as (() => void) | undefined,
  gameProps: undefined as BoltGame3DProps | undefined,
}));

// Keep the real map screen, storage and App routing. Isolate the 3D renderer,
// unrelated menus and animation timing so these cover the mobile flow cheaply.
vi.mock("framer-motion", () => {
  const animationProps = new Set(["initial", "animate", "exit", "transition", "whileTap", "whileHover"]);
  const element = (tag: string) => ({ children, ...props }: { children?: ReactNode } & Record<string, unknown>) =>
    createElement(tag, Object.fromEntries(Object.entries(props).filter(([key]) => !animationProps.has(key))), children);
  return {
    AnimatePresence: ({ children }: { children: ReactNode }) => children,
    motion: { div: element("div"), button: element("button") },
  };
});

vi.mock("./screens/IntroScreen", () => ({
  default: ({ onPlay }: { onPlay: () => void }) => createElement("button", { onClick: onPlay }, "Choose hero"),
}));
vi.mock("./LoadingScreen", () => ({
  default: ({ label }: { label: string }) => createElement("div", null, label),
}));
vi.mock("./screens/HeroSelectScreen", () => ({
  default: ({ onSelect }: { onSelect: (hero: string) => void }) =>
    createElement("button", { onClick: () => onSelect("luna") }, "Select Luna"),
}));
vi.mock("@game/BoltGame3D", () => ({
  default: (props: BoltGame3DProps) => {
    shell.gameProps = props;
    return createElement("div", { "data-testid": "game" }, props.mapId);
  },
}));
vi.mock("@game/bolt/sfx", () => ({ playSfx: vi.fn() }));
vi.mock("@game/bolt/nativeDevice", () => ({ setForceNativeApp: vi.fn() }));
vi.mock("./native", () => ({
  initNativeShell: (back: () => void) => { shell.nativeBack = back; },
  hideSplashWhenReady: vi.fn().mockResolvedValue(undefined),
  hapticPress: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("./leaderboard", () => ({
  flushPendingScore: vi.fn().mockResolvedValue(undefined),
  getNickname: vi.fn().mockReturnValue("Runner"),
  submitScore: vi.fn().mockResolvedValue(undefined),
}));

let root: Root;
let container: HTMLDivElement;

async function settle(action: () => void) {
  await act(async () => {
    action();
    await vi.dynamicImportSettled();
  });
}

function button(label: string) {
  const result = [...container.querySelectorAll("button")].find(
    (element) => element.getAttribute("aria-label") === label || element.textContent === label,
  );
  expect(result, `button ${label}`).toBeDefined();
  return result!;
}

function radio(mapId: string) {
  const result = container.querySelector<HTMLInputElement>(`input[type="radio"][value="${mapId}"]`);
  expect(result, `map radio ${mapId}`).not.toBeNull();
  return result!;
}

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  shell.nativeBack = undefined;
  shell.gameProps = undefined;
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue(undefined);
  vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(async () => {
  await settle(() => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
});

describe("map selection in the mobile shell", () => {
  it("requires Start Run after hero and map choices and forwards both to the game", async () => {
    await settle(() => root.render(createElement(App)));
    await settle(() => button("Choose hero").click());
    await settle(() => button("Select Luna").click());

    expect(radio("classic").checked).toBe(true);
    expect(radio("boulevard").checked).toBe(false);
    expect(shell.gameProps).toBeUndefined();
    expect(container.textContent).toContain("Concept artwork");

    await settle(() => radio("boulevard").click());
    expect(radio("boulevard").checked).toBe(true);
    expect(radio("classic").checked).toBe(false);
    expect(localStorage.getItem("bolt-map")).toBe("boulevard");
    expect(shell.gameProps).toBeUndefined();
    expect(HTMLMediaElement.prototype.pause).not.toHaveBeenCalled();

    // Difficulty is captured when starting the run, after map selection.
    localStorage.setItem("bolt-difficulty", "hard");
    await settle(() => button("Start run on Bolt Boulevard").click());
    expect(shell.gameProps).toMatchObject({ heroId: "luna", mapId: "boulevard", difficulty: "hard" });
    expect(HTMLMediaElement.prototype.pause).toHaveBeenCalled();
  });

  it("restores a saved map without starting a run and returns to hero selection", async () => {
    sessionStorage.setItem("bolt-phase", "map");
    sessionStorage.setItem("bolt-selected-hero", "luna");
    localStorage.setItem("bolt-map", "boulevard");
    await settle(() => root.render(createElement(App)));

    expect(radio("boulevard").checked).toBe(true);
    expect(shell.gameProps).toBeUndefined();
    await settle(() => button("Back to hero selection").click());
    expect(button("Select Luna")).toBeDefined();
    await settle(() => button("Select Luna").click());
    expect(radio("boulevard").checked).toBe(true);
  });

  it("handles native Back through game, maps, heroes and main menu", async () => {
    sessionStorage.setItem("bolt-phase", "map");
    await settle(() => root.render(createElement(App)));
    await settle(() => button("Start run on Current Map").click());
    expect(container.querySelector('[data-testid="game"]')).not.toBeNull();

    await settle(() => shell.nativeBack?.());
    expect(radio("classic").checked).toBe(true);
    await settle(() => shell.nativeBack?.());
    expect(button("Select Luna")).toBeDefined();
    await settle(() => shell.nativeBack?.());
    expect(button("Choose hero")).toBeDefined();
  });

  it("recovers an interrupted run to hero selection without mounting the game", async () => {
    sessionStorage.setItem("bolt-phase", "play");
    localStorage.setItem("bolt-map", "boulevard");
    await settle(() => root.render(createElement(App)));
    expect(button("Select Luna")).toBeDefined();
    expect(shell.gameProps).toBeUndefined();
    await settle(() => button("Select Luna").click());
    expect(radio("boulevard").checked).toBe(true);
  });
});
