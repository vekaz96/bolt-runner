import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

/** Strip macOS extended attributes that break iOS simulator CodeSign (common on Desktop/iCloud). */
const paths = [
  resolve(root, "ios/App/Pods"),
  resolve(root, "ios/App/App"),
  resolve(root, "node_modules/@capacitor"),
].filter((p) => existsSync(p));

for (const p of paths) {
  try {
    execSync(`xattr -cr "${p}"`, { stdio: "ignore" });
  } catch {
    /* ignore */
  }
}

console.log("[strip-ios-xattr] Cleared extended attributes on ios/Pods + @capacitor");
