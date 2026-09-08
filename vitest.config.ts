import { defineConfig } from "vitest/config";
import path from "node:path";

/**
 * Deliberately standalone from vite.config.ts.
 *
 * The app config resolves `@game` into the sibling kidsvolt-web checkout and
 * throws at load time if it is missing. Tests cover this repo's own logic, so
 * binding them to that would make the suite unrunnable without the other repo —
 * exactly the fragility that keeps CI from existing here. The one `@game` import
 * the tested modules need (`heroes`) is aliased below and only resolved lazily.
 */
const WEB_ROOT = path.resolve(
  import.meta.dirname,
  process.env.KIDS_VOLT_WEB_ROOT ?? "../kidsvolt-web",
);

export default defineConfig({
  resolve: {
    alias: { "@game": path.join(WEB_ROOT, "client/src/components") },
  },
  test: {
    environment: "happy-dom",
    include: ["src/**/*.test.ts"],
    restoreMocks: true,
  },
});
