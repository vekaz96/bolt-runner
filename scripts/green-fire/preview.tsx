import { Component, Suspense, useEffect, useRef, useState, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import * as THREE from "three";
import BoulevardWorld from "@game/bolt/world/BoulevardWorld";
import TrackPlatform from "@game/bolt/TrackPlatform";
import ToyCitySky from "@game/bolt/sky/ToyCitySky";
import ToyCityDecor from "@game/bolt/ToyCityDecor";
import RoadsideProps from "@game/bolt/RoadsideProps";
import { getMapTuning, type MapId } from "@game/bolt/maps";
import "./preview.css";

// This entry is deliberately outside the production app. No pickup state,
// charges, spawning, attacks, or damage is installed by this asset preview.
const MODEL_URL = new URL("../../mobile-game-assests/green-fire-pickup-v1/models/green-fire-pickup.glb", import.meta.url).href;
const WALK_Y = 0.23;
type View = "closeup" | "gameplay";
type LoadState = { state: "loading" | "ready" | "error"; message: string };

/** Each preview owns its loader result; no shared GLTF cache is disposed. */
function disposeModel(root: THREE.Object3D) {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  const textures = new Set<THREE.Texture>();
  root.traverse(object => {
    if (!(object instanceof THREE.Mesh)) return;
    geometries.add(object.geometry);
    const meshMaterials = Array.isArray(object.material) ? object.material : [object.material];
    meshMaterials.forEach(material => {
      materials.add(material);
      Object.values(material).forEach(value => {
        if (value instanceof THREE.Texture) textures.add(value);
      });
    });
  });
  textures.forEach(texture => texture.dispose());
  materials.forEach(material => material.dispose());
  geometries.forEach(geometry => geometry.dispose());
}

function Pickup({ paused, view, onStatus }: { paused: boolean; view: View; onStatus: (status: LoadState) => void }) {
  const [model, setModel] = useState<THREE.Group | null>(null);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const statusRef = useRef(onStatus);
  statusRef.current = onStatus;

  useEffect(() => {
    let cancelled = false;
    let loaded: THREE.Group | null = null;
    let mixer: THREE.AnimationMixer | null = null;
    statusRef.current({ state: "loading", message: "Loading animated pickup…" });
    void new GLTFLoader().loadAsync(MODEL_URL).then(gltf => {
      if (cancelled) {
        disposeModel(gltf.scene);
        return;
      }
      loaded = gltf.scene;
      const clip = gltf.animations.find(animation => animation.name === "GreenFire_Idle");
      if (!clip) throw new Error("The model is missing its GreenFire_Idle animation.");
      mixer = new THREE.AnimationMixer(loaded);
      mixer.clipAction(clip).setLoop(THREE.LoopRepeat, Infinity).play();
      mixer.update(0);
      mixerRef.current = mixer;
      setModel(loaded);
      statusRef.current({ state: "ready", message: `Animated 3D asset · ${clip.duration.toFixed(1)} second loop` });
    }).catch(error => {
      if (cancelled) return;
      if (loaded) { disposeModel(loaded); loaded = null; }
      statusRef.current({ state: "error", message: error instanceof Error ? error.message : "The green-fire model could not load." });
    });
    return () => {
      cancelled = true;
      mixer?.stopAllAction();
      if (loaded) {
        mixer?.uncacheRoot(loaded);
        disposeModel(loaded);
      }
      mixerRef.current = null;
    };
  }, []);

  useFrame((_, delta) => {
    if (!paused) mixerRef.current?.update(Math.min(delta, 0.05));
  });

  if (!model) return null;
  return (
    <group position={view === "gameplay" ? [4, WALK_Y, 0] : [0, 0, 0]} rotation={[0, view === "gameplay" ? -Math.PI / 2 : 0, 0]} scale={view === "gameplay" ? 0.7 : 1}>
      <primitive object={model} dispose={null} />
    </group>
  );
}

function Camera({ view }: { view: View }) {
  const { camera } = useThree();
  useEffect(() => {
    if (view === "gameplay") {
      // Matches the settled BoltGame3D chase camera at the center lane.
      camera.position.set(-5.8, WALK_Y + 2.2, 0.3);
      camera.lookAt(1, WALK_Y + 1, 0);
    } else {
      camera.position.set(1.25, 1.15, 2.2);
      camera.lookAt(0, 0.65, 0);
    }
    camera.updateProjectionMatrix();
  }, [camera, view]);
  return view === "closeup" ? <OrbitControls makeDefault target={[0, 0.65, 0]} minDistance={1.3} maxDistance={7} maxPolarAngle={Math.PI * 0.49} enablePan={false} /> : null;
}

function Scenery({ mapId, onError }: { mapId: MapId; onError: (message: string) => void }) {
  const speed = useRef(0);
  // Classic scenery has built-in idle drift. A playing flag with zero speed
  // freezes its road translation without mounting any gameplay controller.
  const state = useRef<"idle" | "playing" | "paused" | "over">("playing");
  const fog = getMapTuning(mapId).fog;
  return <>
    <color attach="background" args={["#87ceeb"]} />
    <fog attach="fog" args={[fog.color, fog.near, fog.far]} />
    {mapId === "boulevard" ? (
      <BoulevardWorld spdRef={speed} gsRef={state} onReady={() => {}} onError={onError} />
    ) : <>
      <TrackPlatform spdRef={speed} gsRef={state} />
      <Suspense fallback={null}><ToyCitySky spdRef={speed} gsRef={state} /></Suspense>
      <ToyCityDecor spdRef={speed} gsRef={state} lite />
      <RoadsideProps spdRef={speed} gsRef={state} lite mapId="classic" />
    </>}
  </>;
}

class PreviewBoundary extends Component<{ children: ReactNode }, { error: string | null }> {
  state: { error: string | null } = { error: null };
  static getDerivedStateFromError(error: Error) { return { error: error.message }; }
  render() {
    return this.state.error ? <div className="canvas-error" role="alert"><strong>Preview could not load</strong><p>{this.state.error}</p><p>Reload after checking the model files and development server.</p></div> : this.props.children;
  }
}

function App() {
  const [view, setView] = useState<View>("closeup");
  const [mapId, setMapId] = useState<MapId>("boulevard");
  const [paused, setPaused] = useState(false);
  const [status, setStatus] = useState<LoadState>({ state: "loading", message: "Loading animated pickup…" });
  const [worldError, setWorldError] = useState("");
  return <main>
    <header><a className="brand" href="/">BOLT RUNNER</a><span className="phase">PHASE 01 · ASSET PREVIEW</span></header>
    <section className="intro"><div><p className="eyebrow">A new power on the road</p><h1>Green Fire</h1><p className="description">An emerald flame with a bright lime heart, gentle floating motion and rising sparks.</p></div><span className="asset-tag">ANIMATED 3D PICKUP</span></section>
    <div className="workspace">
      <section className={`preview-panel ${view}`} aria-label="Interactive green-fire model preview">
        <div className="viewport">
          <PreviewBoundary key={`${view}-${mapId}`}>
            <Canvas camera={{ fov: 60, position: [1.25, 1.15, 2.2], near: 0.05, far: 180 }} dpr={[1, 2]} gl={{ antialias: true, alpha: false, toneMapping: THREE.NoToneMapping }}>
              <ambientLight intensity={0.9} />
              <directionalLight position={[10, 12, 8]} intensity={1.4} />
              {view === "closeup" ? <>
                <color attach="background" args={["#0a2019"]} />
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.04, 0]}><circleGeometry args={[2.5, 64]} /><meshStandardMaterial color="#112e22" roughness={1} /></mesh>
                <gridHelper args={[5, 20, "#254d3d", "#18382b"]} position={[0, -0.035, 0]} />
              </> : <Scenery key={mapId} mapId={mapId} onError={setWorldError} />}
              <Pickup view={view} paused={paused} onStatus={setStatus} />
              <Camera view={view} />
            </Canvas>
          </PreviewBoundary>
          <div className="view-badge">{view === "closeup" ? "MODEL STUDIO" : `${mapId === "classic" ? "CURRENT MAP" : "BOLT BOULEVARD"} · GAMEPLAY SCALE`}</div>
          {status.state === "loading" && <div className="loading">Loading pickup…</div>}
          {(status.state === "error" || worldError) && <div className="load-error" role="alert">{status.state === "error" ? status.message : worldError}</div>}
        </div>
        <div className="preview-caption"><span className={paused ? "status-dot paused" : "status-dot"} /><span>{paused ? "Animation paused" : status.message}</span><span className="interaction-hint">{view === "closeup" ? "Drag to rotate · scroll to zoom" : "Original chase camera · 0.7× asset scale"}</span></div>
      </section>
      <aside>
        <section className="controls-card"><h2>Inspect the pickup</h2><p className="control-label" id="view-label">View</p><div className="segmented" role="group" aria-labelledby="view-label">{(["closeup", "gameplay"] as const).map(option => <button key={option} aria-pressed={view === option} onClick={() => { setView(option); setWorldError(""); }}>{option === "closeup" ? "Close-up" : "On the road"}</button>)}</div>
          <p className="control-label" id="map-label">Map</p><div className="segmented" role="group" aria-labelledby="map-label">{(["classic", "boulevard"] as const).map(option => <button key={option} aria-pressed={mapId === option && view === "gameplay"} onClick={() => { setMapId(option); setView("gameplay"); setWorldError(""); }}>{option === "classic" ? "Current map" : "Boulevard"}</button>)}</div>
          <button className="pause-button" aria-pressed={paused} onClick={() => setPaused(value => !value)}>{paused ? "Resume animation" : "Pause animation"}</button>
        </section>
        <section className="notes-card"><h2>Made for the road</h2><ul><li>Flame silhouette distinguishes it from lightning and stars.</li><li>Floating flame and sparks are included in the model’s animation.</li><li>Road view uses the game’s actual map components and camera.</li></ul><p className="scope-note">Phase 1 delivers the animated pickup. Collection, stored charges and fire attacks come in later phases.</p></section>
        <a className="download" href={MODEL_URL} download="green-fire-pickup.glb">Download animated GLB <span aria-hidden="true">↗</span></a>
      </aside>
    </div>
    <footer>Live 3D preview · No account or gameplay state is changed.</footer>
  </main>;
}

createRoot(document.getElementById("root")!).render(<App />);
