import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import appIcon from "../mobile-game-assests/moible-appicon.png";
import { gradients, colors } from "./theme";
import BoltIcon from "./ui/BoltIcon";

const TIPS = [
  "Tip: Jump the robots! 🤖",
  "lightning",
  "star",
  "Tip: The longer you run, the faster it gets! 🏃",
  "Tip: Dodge the blocks 🧱 — don't crash!",
];

export default function LoadingScreen({ label = "Loading Bolt Runner…" }: { label?: string }) {
  const [tip, setTip] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTip((t) => (t + 1) % TIPS.length), 2600);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      className="immersive-root immersive-safe flex flex-col items-center justify-center px-8 text-center"
      style={{ background: gradients.forest }}
    >
      {/* Animated branded mark */}
      <motion.img
        src={appIcon}
        alt="Bolt Runner"
        draggable={false}
        className="w-28 h-28 rounded-3xl mb-6"
        style={{ boxShadow: "0 12px 40px rgba(0,0,0,0.5)" }}
        initial={{ scale: 0.6, opacity: 0, rotate: -8 }}
        animate={{
          scale: [1, 1.05, 1],
          opacity: 1,
          rotate: [0, 3, -3, 0],
        }}
        transition={{
          scale: { duration: 2, repeat: Infinity, ease: "easeInOut" },
          rotate: { duration: 4, repeat: Infinity, ease: "easeInOut" },
          opacity: { duration: 0.4 },
        }}
      />

      <h1 className="font-display text-3xl font-bold tracking-wide text-white mb-1">
        BOLT RUNNER
      </h1>
      <p className="font-display text-sm font-semibold mb-7" style={{ color: colors.gold }}>
        {label}
      </p>

      {/* Indeterminate shimmer bar (lazy import gives no real %, so we keep it
          intentional rather than fake-precise). */}
      <div
        className="relative w-56 h-2 rounded-full overflow-hidden mb-6"
        style={{ background: "rgba(255,255,255,0.15)" }}
      >
        <div
          className="absolute inset-y-0 w-1/3 rounded-full"
          style={{
            background: `linear-gradient(90deg, transparent, ${colors.lime}, ${colors.green}, transparent)`,
            animation: "shimmer 1.3s ease-in-out infinite",
          }}
        />
      </div>

      {/* Rotating gameplay tips */}
      <div className="min-h-6 overflow-hidden">
        <motion.p
          key={tip}
          className="text-sm font-medium text-white/80"
          initial={{ y: 14, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4 }}
        >
          {TIPS[tip] === "lightning" ? <span className="inline-flex items-center gap-1">Tip: Grab every <BoltIcon name="lightning" size={22} /> to boost your score!</span> : TIPS[tip] === "star" ? <span className="inline-flex items-center gap-1">Tip: Stars <BoltIcon name="star" size={22} /> are worth big points!</span> : TIPS[tip]}
        </motion.p>
      </div>
    </div>
  );
}
