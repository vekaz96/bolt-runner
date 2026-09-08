import { useEffect } from "react";
import { motion } from "framer-motion";
import boulevardPreview from "../../mobile-game-assests/map-concepts/bolt-boulevard-preview-v1.png";
import type { MapId } from "../maps";
import { hapticPress } from "../native";
import { colors, gradients } from "../theme";
import BoltIcon from "../ui/BoltIcon";
import GameButton from "../ui/GameButton";

interface MapSelectScreenProps {
  selectedMap: MapId;
  onSelect: (mapId: MapId) => void;
  onStart: () => void;
  onBack: () => void;
  onReady?: () => void;
}

const MAP_OPTIONS = [
  {
    id: "classic",
    name: "Current Map",
    subtitle: "Toy City",
    description: "Run through the familiar Toy City streets.",
  },
  {
    id: "boulevard",
    name: "Bolt Boulevard",
    subtitle: "A new neighborhood",
    description: "Colorful storefronts, leafy sidewalks and a landmark clock tower.",
  },
] as const;

export default function MapSelectScreen({
  selectedMap,
  onSelect,
  onStart,
  onBack,
  onReady,
}: MapSelectScreenProps) {
  useEffect(() => {
    onReady?.();
  }, [onReady]);

  const selectedName = MAP_OPTIONS.find((map) => map.id === selectedMap)!.name;

  return (
    <div
      className="relative h-full w-full overflow-y-auto overscroll-contain touch-pan-y"
      style={{ background: gradients.forest }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        aria-hidden="true"
        style={{
          background: "radial-gradient(ellipse at 50% 25%, #7ec8f0 0%, transparent 60%)",
        }}
      />
      <div
        className="relative mx-auto flex min-h-full w-full max-w-md flex-col px-5"
        style={{
          paddingTop: "max(16px, env(safe-area-inset-top))",
          paddingBottom: "max(16px, env(safe-area-inset-bottom))",
        }}
      >
        <header className="shrink-0">
          <div className="mb-3 flex items-center gap-3">
            <motion.button
              type="button"
              onClick={() => {
                void hapticPress();
                onBack();
              }}
              whileTap={{ scale: 0.9 }}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-yellow-300"
              style={{
                background: "rgba(0,0,0,0.45)",
                border: "1px solid rgba(255,255,255,0.2)",
              }}
              aria-label="Back to hero selection"
            >
              <BoltIcon name="arrow-left" size={26} />
            </motion.button>
            <p className="font-display text-sm font-semibold tracking-wide text-white/75">
              HERO READY · PICK YOUR ROUTE
            </p>
          </div>
          <h1
            id="map-select-heading"
            className="font-display text-center text-3xl font-bold tracking-wide text-white"
            style={{ textShadow: "0 2px 12px rgba(0,0,0,0.5)" }}
          >
            CHOOSE YOUR MAP
          </h1>
          <p className="mt-2 text-center text-sm text-white/75">Where will you run today?</p>
        </header>

        <fieldset aria-labelledby="map-select-heading" className="my-5 flex min-w-0 flex-col gap-4">
          {MAP_OPTIONS.map((map) => {
            const active = selectedMap === map.id;
            return (
              <label key={map.id} className="relative block cursor-pointer">
                <input
                  type="radio"
                  name="bolt-map"
                  value={map.id}
                  checked={active}
                  onChange={() => {
                    void hapticPress();
                    onSelect(map.id);
                  }}
                  className="peer sr-only"
                  aria-labelledby={`map-${map.id}-name`}
                  aria-describedby={`map-${map.id}-description`}
                />
                <span
                  className="flex min-h-40 overflow-hidden rounded-3xl border-2 transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-offset-4 peer-focus-visible:outline-yellow-300"
                  style={{
                    background: active ? "rgba(34,197,94,0.18)" : "rgba(0,0,0,0.3)",
                    borderColor: active ? colors.gold : "rgba(255,255,255,0.22)",
                    boxShadow: active ? "0 0 20px rgba(253,224,71,0.12)" : undefined,
                  }}
                >
                  {map.id === "boulevard" ? (
                    <span className="relative block w-[32%] shrink-0 overflow-hidden">
                      <img
                        src={boulevardPreview}
                        alt=""
                        draggable={false}
                        className="absolute inset-0 h-full w-full object-cover object-top"
                      />
                      <span className="absolute inset-x-0 bottom-0 bg-black/75 px-1 py-1.5 text-center text-[10px] font-semibold leading-tight text-white">
                        Concept artwork
                      </span>
                    </span>
                  ) : (
                    <span
                      className="flex w-[32%] shrink-0 flex-col items-center justify-center gap-2 px-2"
                      aria-hidden="true"
                      style={{ background: "linear-gradient(150deg, #267656, #0b4631)" }}
                    >
                      <BoltIcon name="home" size={64} />
                      <span className="font-display text-center text-xs font-semibold text-white/80">TOY CITY</span>
                    </span>
                  )}
                  <span className="flex min-w-0 flex-1 flex-col p-4">
                    <span className="mb-1 font-display text-[11px] font-semibold uppercase tracking-wider text-green-300">
                      {map.subtitle}
                    </span>
                    <span id={`map-${map.id}-name`} className="font-display text-xl font-bold leading-tight text-white">
                      {map.name}
                    </span>
                    <span id={`map-${map.id}-description`} className="mt-2 text-xs leading-relaxed text-white/80">
                      {map.description}
                    </span>
                    <span className="mt-3 flex items-center gap-1.5 font-display text-xs font-semibold" style={{ color: active ? colors.gold : "rgba(255,255,255,0.65)" }} aria-hidden="true">
                      {active ? <BoltIcon name="check" size={19} /> : <span className="m-0.5 h-3.5 w-3.5 rounded-full border border-white/50" />}
                      {active ? "Selected" : "Tap to select"}
                    </span>
                  </span>
                </span>
              </label>
            );
          })}
        </fieldset>

        <div className="mt-auto flex shrink-0 flex-col items-center pb-1">
          <p className="mb-2 text-center text-sm font-semibold text-white/80" aria-live="polite">
            Ready for {selectedName}
          </p>
          <GameButton
            variant="primary"
            fullWidth
            onClick={onStart}
            ariaLabel={`Start run on ${selectedName}`}
            className="text-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-yellow-300"
          >
            <span className="inline-flex items-center gap-2">
              <BoltIcon name="play" size={28} />
              START RUN
            </span>
          </GameButton>
        </div>
      </div>
    </div>
  );
}
