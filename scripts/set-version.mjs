/**
 * Single source of truth for the app version.
 *
 * The version lived in four places that drifted independently — package.json
 * (1.0.0), src/theme.ts APP_VERSION (1.0.0), iOS MARKETING_VERSION (1.0) and
 * Android versionName (1.0) — with nothing keeping them in step. Separately, the
 * Android versionCode and iOS CURRENT_PROJECT_VERSION must *increase* on every
 * store upload: Play rejects a second upload that reuses a versionCode, and that
 * failure lands at the worst possible moment.
 *
 *   node scripts/set-version.mjs               # sync everything to package.json, bump builds
 *   node scripts/set-version.mjs 1.2.0         # set a new marketing version, bump builds
 *   node scripts/set-version.mjs --build-only  # keep the version, bump build numbers only
 *   node scripts/set-version.mjs --dry-run     # show what would change
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(fileURLToPath(import.meta.url), "..", "..");
const argv = process.argv.slice(2);
const dryRun = argv.includes("--dry-run");
const buildOnly = argv.includes("--build-only");
const explicit = argv.find((a) => /^\d+\.\d+\.\d+$/.test(a));

const PKG = path.join(ROOT, "package.json");
const THEME = path.join(ROOT, "src/theme.ts");
const PBXPROJ = path.join(ROOT, "ios/App/App.xcodeproj/project.pbxproj");
const GRADLE = path.join(ROOT, "android/app/build.gradle");

const pkg = JSON.parse(fs.readFileSync(PKG, "utf8"));
const version = explicit ?? pkg.version;
if (!/^\d+\.\d+\.\d+$/.test(version)) {
  throw new Error(`Invalid version "${version}" — expected MAJOR.MINOR.PATCH`);
}

const changes = [];

function edit(file, label, replacer) {
  const before = fs.readFileSync(file, "utf8");
  const after = replacer(before);
  if (after === before) {
    changes.push(`  = ${label} (already correct)`);
    return;
  }
  if (!dryRun) fs.writeFileSync(file, after);
  changes.push(`  ${dryRun ? "~" : "✓"} ${label}`);
}

// ── Build numbers ───────────────────────────────────────────────────────
// Derived from the highest existing value across both platforms, so they stay in
// lockstep and can only ever go up.
const gradleSrc = fs.readFileSync(GRADLE, "utf8");
const pbxSrc = fs.readFileSync(PBXPROJ, "utf8");
const currentAndroid = Number(/versionCode\s+(\d+)/.exec(gradleSrc)?.[1] ?? 0);
const currentIos = Number(/CURRENT_PROJECT_VERSION = (\d+)/.exec(pbxSrc)?.[1] ?? 0);
const nextBuild = Math.max(currentAndroid, currentIos) + 1;

console.log(
  `\nversion ${buildOnly ? `${pkg.version} (unchanged)` : version}   build ${currentAndroid}/${currentIos} -> ${nextBuild}\n`,
);

// ── package.json ────────────────────────────────────────────────────────
if (!buildOnly) {
  edit(PKG, `package.json version -> ${version}`, (s) =>
    s.replace(/("version":\s*)"[^"]+"/, `$1"${version}"`),
  );

  // ── src/theme.ts ──────────────────────────────────────────────────────
  edit(THEME, `theme.ts APP_VERSION -> ${version}`, (s) =>
    s.replace(/(APP_VERSION\s*=\s*)"[^"]+"/, `$1"${version}"`),
  );

  // ── iOS marketing version (every build configuration) ─────────────────
  edit(PBXPROJ, `iOS MARKETING_VERSION -> ${version}`, (s) =>
    s.replace(/MARKETING_VERSION = [^;]+;/g, `MARKETING_VERSION = ${version};`),
  );

  // ── Android versionName ───────────────────────────────────────────────
  edit(GRADLE, `Android versionName -> ${version}`, (s) =>
    s.replace(/versionName\s+"[^"]+"/, `versionName "${version}"`),
  );
}

// ── Build numbers, always ───────────────────────────────────────────────
edit(PBXPROJ, `iOS CURRENT_PROJECT_VERSION -> ${nextBuild}`, (s) =>
  s.replace(/CURRENT_PROJECT_VERSION = \d+;/g, `CURRENT_PROJECT_VERSION = ${nextBuild};`),
);
edit(GRADLE, `Android versionCode -> ${nextBuild}`, (s) =>
  s.replace(/versionCode\s+\d+/, `versionCode ${nextBuild}`),
);

console.log(changes.join("\n"));
console.log(
  dryRun
    ? "\n(dry run — nothing written)\n"
    : "\nAll four sources are now in step. Run `pnpm build && cap sync` before archiving.\n",
);
