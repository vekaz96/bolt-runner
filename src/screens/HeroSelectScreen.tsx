import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HEROES, type HeroDefinition, type HeroId } from "@game/bolt/heroes";
import GameButton from "../ui/GameButton";
import WalletPill from "../ui/WalletPill";
import { colors, gradients } from "../theme";
import { hapticPress, hapticSuccess } from "../native";
import { HERO_PRICES, purchaseHero, useHeroUnlocks } from "../heroUnlocks";
import { useWallet } from "../wallet";
import BoltIcon from "../ui/BoltIcon";
import BoltSurface from "../ui/BoltSurface";
import {
  DIFFICULTIES,
  getStoredDifficulty,
  setStoredDifficulty,
  type Difficulty,
} from "@game/bolt/difficulty";

const DIFFICULTY_ORDER: Difficulty[] = ["easy", "medium", "hard"];
const DIFFICULTY_COLOR: Record<Difficulty, string> = {
  easy: "#4ade80",
  medium: "#fde047",
  hard: "#f87171",
};

interface HeroSelectScreenProps {
  onSelect: (heroId: HeroId) => void;
  onBack: () => void;
  immersive?: boolean;
  onReady?: () => void;
}

/*
 * The Speed / Shield / Magnet bars were removed here on purpose. `hero.stats` is
 * never read by any gameplay code — the bars promised abilities the game does not
 * implement, so Luna's "Speed 5" played identically to Bolt's "Speed 4".
 * Restore them together with the real abilities, not before.
 */

function HeroVisual({ hero, locked }: { hero: HeroDefinition; locked: boolean }) {
  return (
    <div
      className="relative w-52 h-60 rounded-3xl flex items-center justify-center"
      style={{
        background:
          "radial-gradient(ellipse at 50% 80%, rgba(74,222,128,0.28) 0%, rgba(5,46,22,0.15) 55%, transparent 100%)",
        border: locked ? "2px solid rgba(255,255,255,0.25)" : "2px solid rgba(253,224,71,0.4)",
        boxShadow: locked ? undefined : "0 0 40px rgba(74,222,128,0.25)",
      }}
    >
      {hero.previewIsImage ? (
        <img
          src={hero.preview}
          alt={hero.name}
          className="max-h-40 max-w-[70%] object-contain drop-shadow-2xl"
          style={locked ? { filter: "grayscale(1) brightness(0.6)" } : undefined}
        />
      ) : (
        <span
          className="text-8xl drop-shadow-2xl select-none"
          style={locked ? { filter: "grayscale(1) brightness(0.7)" } : undefined}
        >
          {hero.preview}
        </span>
      )}
      {locked && (
        <span
          className="absolute top-3 right-3 rounded-full p-2"
          style={{ background: "rgba(0,0,0,0.55)", border: "1px solid rgba(255,255,255,0.25)" }}
        >
          <BoltIcon name="lock" size={26} />
        </span>
      )}
    </div>
  );
}

export default function HeroSelectScreen({ onSelect, onBack, onReady }: HeroSelectScreenProps) {
  const purchased = useHeroUnlocks();
  const balance = useWallet();
  const [index, setIndex] = useState(0);
  const [justUnlocked, setJustUnlocked] = useState<HeroId | null>(null);
  const [denied, setDenied] = useState(0);
  const [difficulty, setDifficulty] = useState<Difficulty>(getStoredDifficulty);

  useEffect(() => {
    onReady?.();
  }, [onReady]);

  const hero = HEROES[index] ?? HEROES[0];
  const isUnlocked = (h: HeroDefinition) => h.unlocked || purchased.has(h.id);
  const heroUnlocked = isUnlocked(hero);
  /** No rig yet — show it in the roster, but never take ⚡ for it. */
  const heroComingSoon = Boolean(hero.comingSoon) || HERO_PRICES[hero.id] == null;
  const price = HERO_PRICES[hero.id] ?? 0;
  const canAfford = balance >= price;
  const canPrev = index > 0;
  const canNext = index < HEROES.length - 1;

  const handleUnlock = () => {
    if (purchaseHero(hero.id)) {
      setJustUnlocked(hero.id);
      void hapticSuccess();
      window.setTimeout(() => setJustUnlocked(null), 1600);
    } else {
      setDenied((d) => d + 1); // retrigger shake
      void hapticPress();
    }
  };

  return (
    <div
      className="flex flex-col h-full w-full overflow-hidden"
      style={{ background: gradients.forest }}
    >
      {/* Soft gradient backdrop — no texture decode on device */}
      <div
        className="absolute inset-0 opacity-30 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 50% 30%, #7ec8f0 0%, transparent 55%), linear-gradient(180deg, #14532d 0%, #052e16 100%)",
        }}
      />

      <div
        className="relative z-10 flex flex-col flex-1 min-h-0 w-full max-w-md mx-auto px-5"
        style={{
          paddingTop: "max(16px, env(safe-area-inset-top))",
          paddingBottom: "max(16px, env(safe-area-inset-bottom))",
        }}
      >
        {/* Header */}
        <motion.div
          className="text-center shrink-0"
          initial={{ y: -16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4 }}
        >
          {/* Back (left) + wallet (centred). The spacer keeps the pill optically
              centred despite the back button on one side. */}
          <div className="flex items-center justify-between mb-1">
            <motion.button
              type="button"
              onClick={() => {
                void hapticPress();
                onBack();
              }}
              whileTap={{ scale: 0.9 }}
              className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
              style={{
                background: "rgba(0,0,0,0.45)",
                border: "1px solid rgba(255,255,255,0.2)",
                backdropFilter: "blur(8px)",
              }}
              aria-label="Back to main menu"
            >
              <BoltIcon name="arrow-left" size={26} />
            </motion.button>
            <WalletPill />
            <span className="w-10 shrink-0" aria-hidden />
          </div>
          <h1
            className="font-display text-2xl font-bold tracking-wide text-white"
            style={{ textShadow: "0 2px 12px rgba(0,0,0,0.5)" }}
          >
            CHOOSE YOUR HERO
          </h1>
        </motion.div>

        {/* Hero preview + arrows — flexes to absorb spare space (no dead band) */}
        <div className="flex-1 min-h-0 flex items-center justify-center gap-2 py-2">
          <ArrowButton dir="prev" disabled={!canPrev} onClick={() => setIndex((i) => i - 1)} />
          <motion.div
            key={hero.id}
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 22 }}
            className="relative flex items-center justify-center"
          >
            <HeroVisual hero={hero} locked={!heroUnlocked} />
            <AnimatePresence>
              {justUnlocked === hero.id && (
                <motion.div
                  className="absolute inset-0 flex items-center justify-center rounded-3xl pointer-events-none"
                  style={{ background: "rgba(74,222,128,0.25)" }}
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <span
                    className="font-display text-xl font-bold px-4 py-2 rounded-2xl"
                    style={{ background: gradients.greenButton, color: colors.ink }}
                  >
                    UNLOCKED!
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
          <ArrowButton dir="next" disabled={!canNext} onClick={() => setIndex((i) => i + 1)} />
        </div>

        {/* Stats card */}
        <motion.div
          className="rounded-2xl p-4 shrink-0"
          style={{
            background: "rgba(0,0,0,0.45)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(74,222,128,0.25)",
          }}
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.4 }}
        >
          <div className="flex items-baseline gap-2 mb-2">
            <h2 className="font-display text-2xl font-bold text-white leading-none">
              {hero.name}
            </h2>
            <span
              className="font-display text-xs font-bold uppercase tracking-wider"
              style={{ color: colors.lime }}
            >
              {hero.title}
            </span>
          </div>
          <p className="text-sm text-white/75 leading-snug">{hero.description}</p>
        </motion.div>

        {/* Roster */}
        <div className="flex justify-center gap-2.5 mt-3 shrink-0">
          {HEROES.map((h, i) => {
            const selected = h.id === hero.id;
            const locked = !isUnlocked(h);
            return (
              <motion.button
                key={h.id}
                type="button"
                onClick={() => {
                  void hapticPress();
                  setIndex(i);
                }}
                whileTap={{ scale: 0.92 }}
                className="relative w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{
                  background: locked
                    ? "rgba(255,255,255,0.08)"
                    : selected
                      ? "linear-gradient(135deg,rgba(74,222,128,0.35),rgba(34,197,94,0.2))"
                      : "rgba(255,255,255,0.12)",
                  border: selected ? `3px solid ${colors.gold}` : "2px solid rgba(255,255,255,0.2)",
                  boxShadow: selected ? "0 0 16px rgba(253,224,71,0.45)" : undefined,
                  opacity: locked && !selected ? 0.65 : 1,
                }}
                aria-label={
                  !locked
                    ? `Select ${h.name}`
                    : HERO_PRICES[h.id] != null
                      ? `${h.name} — locked, ${HERO_PRICES[h.id]} bolts`
                      : `${h.name} — coming soon`
                }
              >
                {h.previewIsImage ? (
                  <img
                    src={h.icon ?? h.preview}
                    alt=""
                    className="w-11 h-11 object-contain"
                    style={locked ? { filter: "grayscale(0.85) brightness(0.75)" } : undefined}
                  />
                ) : (
                  <span className="text-2xl" style={locked ? { filter: "grayscale(1)" } : undefined}>
                    {h.preview}
                  </span>
                )}
                {locked && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex items-center gap-0.5 rounded-full px-1.5 py-px"
                    style={{
                      background: "rgba(0,0,0,0.75)",
                      border:
                        HERO_PRICES[h.id] != null
                          ? "1px solid rgba(253,224,71,0.4)"
                          : "1px solid rgba(255,255,255,0.25)",
                    }}
                  >
                    {HERO_PRICES[h.id] != null ? (
                      <>
                        <BoltIcon name="lightning" size={17} />
                        <span className="text-[9px] font-bold text-white tabular-nums">
                          {HERO_PRICES[h.id]}
                        </span>
                      </>
                    ) : (
                      <span className="text-[8px] font-bold uppercase tracking-wide text-white/70">
                        Soon
                      </span>
                    )}
                  </span>
                )}
                {selected && !locked && (
                  <span
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center"
                    style={{ background: colors.green, border: `2px solid ${colors.gold}` }}
                  >
                    <BoltIcon name="check" size={18} />
                  </span>
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Difficulty */}
        <div className="mt-3 shrink-0">
          <div
            className="flex gap-1 p-1 rounded-2xl"
            style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.14)" }}
            role="radiogroup"
            aria-label="Difficulty"
          >
            {DIFFICULTY_ORDER.map((d) => {
              const active = d === difficulty;
              const tint = DIFFICULTY_COLOR[d];
              return (
                <motion.button
                  key={d}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => {
                    void hapticPress();
                    setDifficulty(d);
                    setStoredDifficulty(d);
                  }}
                  whileTap={{ scale: 0.95 }}
                  className="flex-1 rounded-xl py-2 font-display text-sm font-bold"
                  style={{
                    background: active ? `${tint}26` : "transparent",
                    border: active ? `1.5px solid ${tint}` : "1.5px solid transparent",
                    color: active ? tint : "rgba(255,255,255,0.6)",
                  }}
                >
                  {DIFFICULTIES[d].label}
                  <span className="block text-[9px] font-semibold opacity-70">
                    ×{DIFFICULTIES[d].scoreMultiplier} pts
                  </span>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Primary action: SELECT, COMING SOON, or UNLOCK */}
        <div className="flex flex-col items-center mt-3 shrink-0">
          {heroUnlocked ? (
            <GameButton
              variant="primary"
              onClick={() => onSelect(hero.id)}
              className="!text-xl !py-4 px-16"
              ariaLabel={`Select ${hero.name}`}
            >
              SELECT
            </GameButton>
          ) : heroComingSoon ? (
            <BoltSurface name="button-disabled" className="min-h-[76px] min-w-[250px] px-10 py-4 font-display text-lg font-bold text-white/70" role="status">
              <BoltIcon name="lock" size={26} /><span className="ml-2">COMING SOON</span>
            </BoltSurface>
          ) : (
            <motion.div
              key={denied}
              animate={denied > 0 ? { x: [0, -8, 8, -6, 6, 0] } : undefined}
              transition={{ duration: 0.4 }}
              className="flex flex-col items-center"
            >
              <GameButton
                variant="gold"
                onClick={handleUnlock}
                className="!text-lg !py-4 px-10"
                style={canAfford ? undefined : { opacity: 0.55 }}
                ariaLabel={`Unlock ${hero.name} for ${price} bolts`}
              >
                <span className="inline-flex items-center gap-2">
                  <BoltIcon name="lock" size={26} />
                  UNLOCK
                  <span className="inline-flex items-center gap-1">
                    <BoltIcon name="lightning" size={22} />
                    {price}
                  </span>
                </span>
              </GameButton>
              {!canAfford && (
                <p className="text-xs font-semibold mt-1.5 text-white/70">
                  Collect {price - balance} more <BoltIcon name="lightning" size={16} className="inline-block align-middle" /> in runs to unlock!
                </p>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

function ArrowButton({
  dir,
  disabled,
  onClick,
}: {
  dir: "prev" | "next";
  disabled: boolean;
  onClick: () => void;
}) {
  const icon = dir === "prev" ? "arrow-left" : "arrow-right";
  return (
    <motion.button
      type="button"
      disabled={disabled}
      onClick={() => {
        void hapticPress();
        onClick();
      }}
      whileTap={disabled ? undefined : { scale: 0.9 }}
      className="w-11 h-11 rounded-full flex items-center justify-center shrink-0 disabled:opacity-25 disabled:pointer-events-none"
      style={{ background: gradients.goldButton, color: "#1a1a1a" }}
      aria-label={dir === "prev" ? "Previous hero" : "Next hero"}
    >
      <BoltIcon name={icon} size={30} />
    </motion.button>
  );
}
