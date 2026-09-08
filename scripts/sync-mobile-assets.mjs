/**
 * Copy only game assets needed by Bolt Runner into mobile/public.
 * Drops ~350MB of duplicate/unused FBX from the iOS bundle.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(fileURLToPath(import.meta.url), "..", "..");
const WEB_PUBLIC = path.resolve(
  ROOT,
  process.env.KIDS_VOLT_WEB_ROOT ?? "../kidsvolt-web",
  "client/public",
);
const MOBILE_PUBLIC = path.join(ROOT, "public");

const REQUIRED_FILES = [
  // Rigged mesh + the looping run clip (BOLT_MESH_URL), converted from the
  // 32.5 MB Running.fbx by kidsvolt-web/tools/fbx_to_glb.py.
  "models/characters/bolt.glb",
  // Deferred clips as animation-only GLBs, from kidsvolt-web's
  // tools/fbx_to_glb.py --clip-only. Each used to arrive inside its own ~32.5 MB
  // FBX that was 93% a duplicate of the mesh and its 4K textures; only
  // animations[0] was ever used. 163 MB -> ~370 KB. They must go through the
  // same Blender path as bolt.glb or they land in a different coordinate frame.
  "models/animations/bolt/clips/jump.glb",
  "models/animations/bolt/clips/land.glb",
  "models/animations/bolt/clips/strafeLeft.glb",
  "models/animations/bolt/clips/strafeRight.glb",
  "models/animations/bolt/clips/die.glb",
  "models/robot.glb",
  "models/gold-brick.glb",
  "models/star.glb",
  "models/environment/greentileplatform3dmodel.glb",
  "models/environment/lego-house-small.glb",
  "models/environment/lego-house.glb",
  "models/environment/tree.glb",
  "models/environment/street-lamp.glb",
  "models/environment/park-bench.glb",
  "game/ztmusic-zt-byte-blast-163367.mp3",
  // NOTE: bolt-run.png (2.4MB) is deliberately NOT shipped to mobile — the
  // loader and start screen now use the lighter bolt-hero.png, and the only
  // remaining reference is the web-only 2D BoltGame canvas.
  // Toy City sky panorama (1024×512, ~86KB) — used by ToyCitySky on device.
  "game/sky-toy-city.png",
  // Hero art (white studio background removed, alpha) — carousel + roster tile.
  "game/bolt-hero.png",
  "game/bolt-icon.png",
  "game/luna-hero.png",
  "game/luna-icon.png",
  "game/rex-hero.png",
  "game/rex-icon.png",
  // Luna's and Rex's playable rigs (converted; textures embedded in the GLB).
  "models/characters/luna.glb",
  "models/characters/rex.glb",
  // Roadside props (Kenney, CC0 — see models/props/CREDITS.md). Each pack's
  // .glb files reference a shared Textures/colormap.png by relative path, so
  // the atlas must ship alongside them.
  "models/props/suburban/house-a.glb",
  "models/props/suburban/house-b.glb",
  "models/props/suburban/house-c.glb",
  "models/props/suburban/house-d.glb",
  "models/props/suburban/tree-big.glb",
  "models/props/suburban/planter.glb",
  "models/props/suburban/fence.glb",
  "models/props/suburban/Textures/colormap.png",
  "models/props/commercial/shop-a.glb",
  "models/props/commercial/shop-b.glb",
  "models/props/commercial/Textures/colormap.png",
  "models/props/car/car-sedan.glb",
  "models/props/car/car-taxi.glb",
  "models/props/car/car-van.glb",
  "models/props/car/car-delivery.glb",
  "models/props/car/car-firetruck.glb",
  "models/props/car/cone.glb",
  "models/props/car/Textures/colormap.png",
  "models/props/nature/rock.glb",
  "models/props/nature/grass.glb",
  "models/props/nature/mushrooms.glb",
  // Dodge-able obstacles mixed into the spawn rotation (EXTRA_OBSTACLES).
  // rock-b.glb was dropped along with cone.glb from that list — both read as
  // harmless roadside scenery elsewhere in the scene.
  "models/props/car/crate.glb",
  "models/props/car/tire.glb",
  "models/props/nature/log.glb",
];

function rmrf(dir) {
  if (!fs.existsSync(dir)) return;
  fs.rmSync(dir, { recursive: true, force: true });
}

function copyFile(rel) {
  const src = path.join(WEB_PUBLIC, rel);
  const dest = path.join(MOBILE_PUBLIC, rel);
  if (!fs.existsSync(src)) {
    throw new Error(`Missing asset: ${src}`);
  }
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
}

if (!fs.existsSync(WEB_PUBLIC)) {
  throw new Error(`kidsvolt-web public not found at ${WEB_PUBLIC}`);
}

rmrf(path.join(MOBILE_PUBLIC, "models"));
rmrf(path.join(MOBILE_PUBLIC, "game"));

let bytes = 0;
for (const rel of REQUIRED_FILES) {
  copyFile(rel);
  bytes += fs.statSync(path.join(MOBILE_PUBLIC, rel)).size;
}

// The authored Boulevard kit belongs to this app; ship only runtime GLBs.
// Editable Blender sources and preview renders stay outside the app bundle.
const boulevardRoot = path.join(ROOT, "mobile-game-assests/bolt-boulevard-v1");
const boulevardManifest = JSON.parse(fs.readFileSync(path.join(boulevardRoot, "asset-manifest.json"), "utf8"));
for (const asset of boulevardManifest.assets) {
  const dest = path.join(MOBILE_PUBLIC, "models/boulevard", `${asset.id}.glb`);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(path.join(boulevardRoot, asset.model), dest);
  bytes += fs.statSync(dest).size;
}

// Phase 2's pickup and its HUD render are authored in the mobile asset kit.
// Copy after the models/game cleanup and include both in the same bundle cap.
const greenFireRoot = path.join(ROOT, "mobile-game-assests/green-fire-pickup-v1");
const greenFireFiles = [
  ["models/green-fire-pickup.glb", "models/pickups/green-fire-pickup.glb"],
  ["ui/green-fire-icon.png", "game/green-fire-icon.png"],
];
for (const [source, runtime] of greenFireFiles) {
  const dest = path.join(MOBILE_PUBLIC, runtime);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(path.join(greenFireRoot, source), dest);
  bytes += fs.statSync(dest).size;
}

const totalMb = bytes / 1024 / 1024;

console.log(
  `sync-mobile-assets: ${REQUIRED_FILES.length + boulevardManifest.assets.length + greenFireFiles.length} files (${totalMb.toFixed(1)} MB) → public/`,
);

/**
 * Hard ceiling on the shipped asset payload.
 *
 * The bundle reached 210 MB (291 MB on Android) because nothing ever failed when
 * an upstream model grew — Google Play rejects the build long before a human
 * notices. Raise this deliberately, never to make a build pass.
 */
const MAX_ASSET_MB = Number(process.env.MAX_ASSET_MB ?? 40);
if (totalMb > MAX_ASSET_MB) {
  throw new Error(
    `Asset budget exceeded: ${totalMb.toFixed(1)} MB > ${MAX_ASSET_MB} MB.\n` +
      `Shrink the offending asset (see kidsvolt-web/tools/) rather than raising the cap.`,
  );
}
