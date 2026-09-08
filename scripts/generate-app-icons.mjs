import { execSync } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = path.join(root, "mobile-game-assests/moible-appicon.png");

if (!existsSync(source)) {
  console.error("Missing source icon:", source);
  process.exit(1);
}

function resize(width, height, output) {
  mkdirSync(path.dirname(output), { recursive: true });
  execSync(`sips -z ${height} ${width} "${source}" --out "${output}"`, { stdio: "inherit" });
}

const iosIcon = path.join(
  root,
  "ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png",
);
resize(1024, 1024, iosIcon);
console.log("Updated iOS app icon:", iosIcon);

const androidLauncherSizes = {
  "mipmap-mdpi": 48,
  "mipmap-hdpi": 72,
  "mipmap-xhdpi": 96,
  "mipmap-xxhdpi": 144,
  "mipmap-xxxhdpi": 192,
};

for (const [folder, size] of Object.entries(androidLauncherSizes)) {
  const base = path.join(root, "android/app/src/main/res", folder);
  for (const name of ["ic_launcher.png", "ic_launcher_round.png"]) {
    resize(size, size, path.join(base, name));
  }
}

const androidForegroundSizes = {
  "mipmap-mdpi": 108,
  "mipmap-hdpi": 162,
  "mipmap-xhdpi": 216,
  "mipmap-xxhdpi": 324,
  "mipmap-xxxhdpi": 432,
};

for (const [folder, size] of Object.entries(androidForegroundSizes)) {
  resize(size, size, path.join(root, "android/app/src/main/res", folder, "ic_launcher_foreground.png"));
}

console.log("App icons generated from mobile-game-assests/moible-appicon.png");
