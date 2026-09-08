import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs";
import path from "node:path";
import { defineConfig } from "vite";

/** Sibling kidsvolt-web repo, or override with KIDS_VOLT_WEB_ROOT */
const WEB_ROOT = path.resolve(
  import.meta.dirname,
  process.env.KIDS_VOLT_WEB_ROOT ?? "../kidsvolt-web",
);
const GAME_COMPONENTS = path.join(WEB_ROOT, "client/src/components");
const WEB_PUBLIC = path.join(WEB_ROOT, "client/public");

if (!fs.existsSync(GAME_COMPONENTS)) {
  throw new Error(
    `kidsvolt-web not found at ${WEB_ROOT}. Clone it as a sibling or set KIDS_VOLT_WEB_ROOT.`,
  );
}

const MOBILE_ROOT = import.meta.dirname;
const MOBILE_PUBLIC = path.join(MOBILE_ROOT, "public");

export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: {
    __MOBILE_BUILD_ID__: JSON.stringify(new Date().toISOString().slice(0, 16).replace("T", " ")),
  },
  resolve: {
    alias: {
      "@game": GAME_COMPONENTS,
      react: path.join(MOBILE_ROOT, "node_modules/react"),
      "react-dom": path.join(MOBILE_ROOT, "node_modules/react-dom"),
      "react/jsx-runtime": path.join(MOBILE_ROOT, "node_modules/react/jsx-runtime"),
      "react/jsx-dev-runtime": path.join(MOBILE_ROOT, "node_modules/react/jsx-dev-runtime"),
    },
    dedupe: ["react", "react-dom", "three", "@react-three/fiber", "@react-three/drei"],
  },
  publicDir: MOBILE_PUBLIC,
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
  optimizeDeps: {
    include: ["react", "react-dom", "@react-three/fiber", "@react-three/drei", "three"],
  },
  server: {
    port: 5173,
    host: true,
    fs: {
      allow: [WEB_ROOT, import.meta.dirname],
    },
  },
});
