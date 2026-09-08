import "@capacitor/core";
import { createRoot } from "react-dom/client";
import App from "./App";
import { BootError } from "./BootError";
import { hideSplashWhenReady } from "./native";
import { startSession } from "./telemetry";
import "./index.css";

// First thing, before anything heavy: this is what detects a WKWebView kill from
// the *previous* session (no clean-exit marker) — the failure the memory
// workarounds exist for, and which was previously invisible.
startSession();

void hideSplashWhenReady();

createRoot(document.getElementById("root")!).render(
  <BootError>
    <App />
  </BootError>,
);
