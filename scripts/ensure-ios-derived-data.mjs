import { existsSync, lstatSync, mkdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const iosDerived = resolve(root, "ios/DerivedData");
const tmpDerived = "/tmp/kidsvolt-ios-derived";
const iosCapConfig = resolve(root, "ios/App/App/capacitor.config.json");

mkdirSync(tmpDerived, { recursive: true });

if (existsSync(iosDerived)) {
  const stat = lstatSync(iosDerived);
  if (!stat.isSymbolicLink()) {
    rmSync(iosDerived, { recursive: true, force: true });
    symlinkSync(tmpDerived, iosDerived);
  }
} else {
  symlinkSync(tmpDerived, iosDerived);
}

if (existsSync(iosCapConfig)) {
  const config = JSON.parse(readFileSync(iosCapConfig, "utf8"));
  if (config.server?.url) {
    delete config.server.url;
    writeFileSync(iosCapConfig, `${JSON.stringify(config, null, "\t")}\n`);
  }
}
