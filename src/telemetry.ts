/**
 * Minimal, self-contained crash + breadcrumb recorder.
 *
 * The whole codebase is shaped around avoiding WKWebView memory kills, yet there
 * was no way to tell whether they still happen. A third-party SDK needs an
 * account, a DSN, and — for a children's app — a privacy review, so this does the
 * one thing that actually detects the failure mode, with no network and no PII:
 *
 *   a WebView process kill never runs our unload handler, so the "clean exit"
 *   marker is missing on the next launch. That absence *is* the crash signal.
 *
 * Everything lives in localStorage, which survives a WebView process kill (unlike
 * sessionStorage or memory). Nothing is transmitted. `exportDiagnostics()` returns
 * a string the player (or you) can copy out of Settings.
 *
 * To add a real reporter later, forward from `report()` — every call site already
 * funnels through it.
 */

const CLEAN_KEY = "bolt-diag-clean";
const CRUMBS_KEY = "bolt-diag-crumbs";
const REPORTS_KEY = "bolt-diag-reports";
const MAX_CRUMBS = 40;
const MAX_REPORTS = 10;

export interface Breadcrumb {
  t: number;
  name: string;
  data?: Record<string, string | number | boolean>;
}

export interface DiagReport {
  t: number;
  kind: "crash" | "error" | "contextlost" | "unclean-exit";
  message: string;
  crumbs: Breadcrumb[];
}

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage full or blocked — diagnostics must never break the app */
  }
}

/** Device facts that help explain a memory kill. Deliberately no identifiers. */
function deviceContext(): Record<string, string | number> {
  const ctx: Record<string, string | number> = {};
  try {
    ctx.screen = `${window.screen?.width ?? 0}x${window.screen?.height ?? 0}@${window.devicePixelRatio ?? 1}`;
    const nav = navigator as Navigator & { deviceMemory?: number; hardwareConcurrency?: number };
    if (nav.deviceMemory) ctx.deviceMemoryGb = nav.deviceMemory;
    if (nav.hardwareConcurrency) ctx.cores = nav.hardwareConcurrency;
  } catch {
    /* ignore */
  }
  return ctx;
}

export function breadcrumb(name: string, data?: Breadcrumb["data"]) {
  const crumbs = read<Breadcrumb[]>(CRUMBS_KEY, []);
  crumbs.push({ t: Date.now(), name, data });
  write(CRUMBS_KEY, crumbs.slice(-MAX_CRUMBS));
}

export function report(kind: DiagReport["kind"], message: string) {
  const reports = read<DiagReport[]>(REPORTS_KEY, []);
  reports.push({
    t: Date.now(),
    kind,
    message: String(message).slice(0, 500),
    crumbs: read<Breadcrumb[]>(CRUMBS_KEY, []).slice(-15),
  });
  write(REPORTS_KEY, reports.slice(-MAX_REPORTS));
  // Visible in Safari/Chrome devtools when attached to the device.
  console.error(`[diag:${kind}]`, message);
}

/**
 * Call once at startup, before anything heavy.
 *
 * If the previous session never marked a clean exit, it was killed — by iOS
 * jetsam, an OOM, or a hard crash. That is the signal we could not previously see.
 */
export function startSession() {
  let previousWasUnclean = false;
  try {
    previousWasUnclean = localStorage.getItem(CLEAN_KEY) === "0";
  } catch {
    /* ignore */
  }

  if (previousWasUnclean) {
    const crumbs = read<Breadcrumb[]>(CRUMBS_KEY, []);
    const last = crumbs[crumbs.length - 1];
    report(
      "unclean-exit",
      `previous session did not exit cleanly; last breadcrumb: ${last?.name ?? "none"}`,
    );
  }

  write(CRUMBS_KEY, []);
  try {
    localStorage.setItem(CLEAN_KEY, "0");
  } catch {
    /* ignore */
  }
  breadcrumb("session-start", deviceContext());

  const markClean = () => {
    try {
      localStorage.setItem(CLEAN_KEY, "1");
    } catch {
      /* ignore */
    }
  };
  // pagehide is the reliable one in WKWebView; visibilitychange covers backgrounding.
  window.addEventListener("pagehide", markClean);
  window.addEventListener("beforeunload", markClean);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") markClean();
    else {
      try {
        localStorage.setItem(CLEAN_KEY, "0");
      } catch {
        /* ignore */
      }
    }
  });

  window.addEventListener("error", (e) => report("error", e.message));
  window.addEventListener("unhandledrejection", (e) =>
    report("error", `unhandled rejection: ${String((e as PromiseRejectionEvent).reason)}`),
  );

  // The game dispatches this rather than importing anything platform-specific.
  window.addEventListener("bolt-webgl-context-lost", () =>
    report("contextlost", "WebGL context lost"),
  );

  return { previousWasUnclean };
}

export function getReports(): DiagReport[] {
  return read<DiagReport[]>(REPORTS_KEY, []);
}

export function clearReports() {
  write(REPORTS_KEY, []);
}

/** Human-readable dump for Settings — the only way this data ever leaves the device. */
export function exportDiagnostics(): string {
  const reports = getReports();
  if (reports.length === 0) return "No issues recorded.";
  return reports
    .map((r) => {
      const when = new Date(r.t).toISOString();
      const trail = r.crumbs.map((c) => c.name).join(" > ");
      return `[${when}] ${r.kind}: ${r.message}\n  trail: ${trail}`;
    })
    .join("\n\n");
}
