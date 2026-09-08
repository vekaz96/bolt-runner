import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);

const hasLiveReload = args.includes("--live-reload");
const hasPort = args.some(a => a === "--port" || a.startsWith("--port="));

if (hasLiveReload && !hasPort) {
  args.push("--port", "5173");
  console.log("[cap-run-ios] Live reload → port 5173 (run `pnpm dev` in another terminal)");
}

function stripLiveReloadUrl(configPath) {
  if (!existsSync(configPath)) return;
  const config = JSON.parse(readFileSync(configPath, "utf8"));
  if (config.server?.url) {
    delete config.server.url;
    writeFileSync(configPath, `${JSON.stringify(config, null, "\t")}\n`);
    console.log("[cap-run-ios] Removed stale server.url from", configPath);
  }
}

if (!hasLiveReload) {
  stripLiveReloadUrl(resolve(root, "ios/App/App/capacitor.config.json"));
  stripLiveReloadUrl(resolve(root, "android/app/src/main/assets/capacitor.config.json"));

  console.log("[cap-run-ios] Building web bundle + syncing to ios/ …");
  const build = spawnSync("pnpm", ["build"], { cwd: root, stdio: "inherit" });
  if (build.status !== 0) process.exit(build.status ?? 1);
  const sync = spawnSync("pnpm", ["exec", "cap", "sync", "ios"], { cwd: root, stdio: "inherit" });
  if (sync.status !== 0) process.exit(sync.status ?? 1);
}

spawnSync("node", ["scripts/ensure-ios-derived-data.mjs"], { cwd: root, stdio: "inherit" });
spawnSync("node", ["scripts/strip-ios-xattr.mjs"], { cwd: root, stdio: "inherit" });

const result = spawnSync("pnpm", ["exec", "cap", "run", "ios", ...args], {
  cwd: root,
  stdio: "inherit",
});

process.exit(result.status ?? 1);
