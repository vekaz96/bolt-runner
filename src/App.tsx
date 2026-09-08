import { lazy, Suspense, useState, useEffect, useCallback, useRef } from "react";
import { setForceNativeApp } from "@game/bolt/nativeDevice";
import { motion, AnimatePresence } from "framer-motion";
import type { HeroId } from "@game/bolt/heroes";
import LoadingScreen from "./LoadingScreen";
import IntroScreen from "./screens/IntroScreen";
import GameShell from "./screens/GameShell";
import { hideSplashWhenReady, initNativeShell } from "./native";
import { addBolts } from "./wallet";
import { getStoredDifficulty, type Difficulty } from "@game/bolt/difficulty";
import { flushPendingScore, getNickname, submitScore } from "./leaderboard";
import introMusic from "../mobile-game-assests/intro-music.mp3";
import { boltIcons, boltSurfaces } from "./ui/boltAssets";
import { getStoredMap, setStoredMap, type MapId } from "./maps";

const mobileGameUiSkin = {
  icons: boltIcons,
  surfaces: {
    "button-primary": boltSurfaces["button-primary"],
    "button-secondary": boltSurfaces["button-secondary"],
    // The wallet plate is the lightning-bolt twin of the trophy plate, so the
    // score and best panels read as a matched pair on the game-over card.
    "panel-score": boltSurfaces["panel-wallet"],
    "panel-personal-best": boltSurfaces["panel-personal-best"],
  },
};

const HeroSelectScreen = lazy(() => import("./screens/HeroSelectScreen"));
const MapSelectScreen = lazy(() => import("./screens/MapSelectScreen"));
const LeaderboardScreen = lazy(() => import("./screens/LeaderboardScreen"));
const NicknameModal = lazy(() => import("./screens/NicknameModal"));
const BoltGame3D = lazy(() => import("@game/BoltGame3D"));

type Phase = "intro" | "select" | "map" | "play" | "leaderboard";

export default function App() {
  const [phase, setPhase] = useState<Phase>(() => {
    try {
      const saved = sessionStorage.getItem("bolt-phase");
      // Never auto-restore "play" — WebView crash would OOM-loop on reload.
      return saved === "select" || saved === "map" ? saved : "intro";
    } catch {
      return "intro";
    }
  });
  const [selectedHero, setSelectedHero] = useState<HeroId>(() => {
    try {
      return (sessionStorage.getItem("bolt-selected-hero") as HeroId) || "bolt";
    } catch {
      return "bolt";
    }
  });
  const [selectedMap, setSelectedMap] = useState<MapId>(getStoredMap);
  /** Captured when the run starts so mid-run storage changes can't retune it. */
  const [difficulty, setDifficulty] = useState<Difficulty>(getStoredDifficulty);
  /** Shown after a run when the player has no leaderboard name yet. */
  const [askNickname, setAskNickname] = useState(false);
  const pendingRunScore = useRef<number | null>(null);
  const [introReady, setIntroReady] = useState(false);
  const [heroReady, setHeroReady] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [gameReady, setGameReady] = useState(false);
  const phaseRef = useRef(phase);
  phaseRef.current = phase;

  useEffect(() => {
    setForceNativeApp(true);
    try {
      const saved = sessionStorage.getItem("bolt-phase");
      if (saved === "play") {
        sessionStorage.setItem("bolt-phase", "select");
        setPhase("select");
        setGameReady(false);
      }
    } catch {
      /* ignore */
    }
    return () => setForceNativeApp(false);
  }, []);

  const handleIntroReady = useCallback(() => setIntroReady(true), []);
  const handleHeroReady = useCallback(() => setHeroReady(true), []);
  const handleMapReady = useCallback(() => setMapReady(true), []);

  useEffect(() => {
    try {
      sessionStorage.setItem("bolt-phase", phase);
    } catch {
      /* ignore */
    }
  }, [phase]);

  // One menu theme shared across intro, hero selection and map selection.
  // It doesn't restart between those phases; stops once gameplay begins.
  const musicRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio(introMusic);
    audio.loop = true;
    audio.volume = 0.4;
    musicRef.current = audio;
    return () => {
      audio.pause();
      musicRef.current = null;
    };
  }, []);

  useEffect(() => {
    const audio = musicRef.current;
    if (!audio) return;

    const isMuted = () => {
      try {
        return localStorage.getItem("bolt-music-muted") === "1";
      } catch {
        return false;
      }
    };
    const play = () => void audio.play().catch(() => {});
    const syncMusic = () => {
      if ((phase === "intro" || phase === "select" || phase === "map") && !isMuted()) {
        play();
      } else {
        audio.pause();
      }
    };

    syncMusic();
    // iOS/WKWebView blocks audio autoplay — retry on the first user tap.
    const onInteract = () => {
      syncMusic();
      window.removeEventListener("pointerdown", onInteract);
    };
    window.addEventListener("pointerdown", onInteract);
    // Settings toggle applies immediately, not just on the next phase change.
    window.addEventListener("bolt-settings-changed", syncMusic);
    return () => {
      window.removeEventListener("pointerdown", onInteract);
      window.removeEventListener("bolt-settings-changed", syncMusic);
    };
  }, [phase]);

  // Retry a score stranded offline by a previous session. Never throws.
  useEffect(() => {
    void flushPendingScore();
  }, []);

  useEffect(() => {
    void initNativeShell(() => {
      if (phaseRef.current === "play") {
        setGameReady(false);
        setPhase("map");
      } else if (phaseRef.current === "map") {
        setPhase("select");
      } else if (phaseRef.current === "select" || phaseRef.current === "leaderboard") {
        setPhase("intro");
      }
    });
  }, []);

  useEffect(() => {
    if (phase === "intro" && introReady) {
      void hideSplashWhenReady();
    }
  }, [phase, introReady]);

  useEffect(() => {
    if (phase === "select" && heroReady) {
      void hideSplashWhenReady();
    }
  }, [phase, heroReady]);

  useEffect(() => {
    if (phase === "map" && mapReady) {
      void hideSplashWhenReady();
    }
  }, [phase, mapReady]);

  useEffect(() => {
    if (phase === "play" && gameReady) {
      void hideSplashWhenReady();
    }
  }, [phase, gameReady]);

  const goToMainMenu = useCallback(() => {
    setGameReady(false);
    try {
      sessionStorage.removeItem("bolt-phase");
    } catch {
      /* ignore */
    }
    setPhase("intro");
  }, []);

  let screen: React.ReactNode;
  if (phase === "intro") {
    screen = (
      <IntroScreen
        onReady={handleIntroReady}
        onPlay={() => setPhase("select")}
        onLeaderboard={() => setPhase("leaderboard")}
      />
    );
  } else if (phase === "select") {
    screen = (
      <div className="h-full w-full">
        <Suspense fallback={<LoadingScreen label="Loading heroes…" />}>
          <HeroSelectScreen
            immersive
            onReady={handleHeroReady}
            onSelect={(heroId) => {
              setSelectedHero(heroId);
              try {
                sessionStorage.setItem("bolt-selected-hero", heroId);
              } catch {
                /* ignore */
              }
              setGameReady(false);
              setPhase("map");
            }}
            onBack={() => setPhase("intro")}
          />
        </Suspense>
      </div>
    );
  } else if (phase === "map") {
    screen = (
      <div className="h-full w-full">
        <Suspense fallback={<LoadingScreen label="Loading maps…" />}>
          <MapSelectScreen
            selectedMap={selectedMap}
            onReady={handleMapReady}
            onSelect={(mapId) => {
              setSelectedMap(mapId);
              setStoredMap(mapId);
            }}
            onStart={() => {
              setDifficulty(getStoredDifficulty());
              setGameReady(false);
              setPhase("play");
            }}
            onBack={() => setPhase("select")}
          />
        </Suspense>
      </div>
    );
  } else if (phase === "leaderboard") {
    screen = (
      <div className="h-full w-full">
        <Suspense fallback={<LoadingScreen label="Loading leaderboard…" />}>
          <LeaderboardScreen onBack={() => setPhase("intro")} />
        </Suspense>
      </div>
    );
  } else {
    screen = (
      <GameShell onMainMenu={goToMainMenu}>
        <Suspense fallback={<LoadingScreen label="Loading game…" />}>
          <BoltGame3D
            key={`${selectedHero}-${selectedMap}-${difficulty}`}
            standalone
            immersive
            /* Matches the app name, icon and store listing — the web build keeps
               its own "Bolt the Bouncer" wording via the prop default. */
            title="BOLT RUNNER"
            heroId={selectedHero}
            mapId={selectedMap}
            difficulty={difficulty}
            autoStart={false}
            uiSkin={mobileGameUiSkin}
            onRunEnd={(score) => {
              addBolts(score);
              // Fire-and-forget: submitScore never throws and queues offline.
              if (getNickname()) {
                void submitScore(score, difficulty);
              } else if (score > 0) {
                pendingRunScore.current = score;
                setAskNickname(true);
              }
            }}
            onReadyChange={setGameReady}
            onBackToMenu={goToMainMenu}
            onBackToHeroSelect={() => {
              setGameReady(false);
              setPhase("select");
            }}
          />
        </Suspense>
      </GameShell>
    );
  }

  return (
    <>
      <AnimatePresence mode="wait">
        <motion.div
          key={phase}
          className="immersive-root"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          {screen}
        </motion.div>
      </AnimatePresence>

      {/* Sits above the phase transition so a first score can be claimed
          without interrupting the game-over screen underneath. */}
      <AnimatePresence>
        {askNickname && (
          <Suspense fallback={null}>
            <NicknameModal
              key="first-nickname"
              onSaved={() => {
                setAskNickname(false);
                const score = pendingRunScore.current;
                pendingRunScore.current = null;
                if (score) void submitScore(score, difficulty);
              }}
              onClose={() => {
                setAskNickname(false);
                pendingRunScore.current = null;
              }}
            />
          </Suspense>
        )}
      </AnimatePresence>
    </>
  );
}
