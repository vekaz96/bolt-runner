import { App as CapApp } from "@capacitor/app";
import { SplashScreen } from "@capacitor/splash-screen";
import { StatusBar, Style } from "@capacitor/status-bar";
import { Capacitor } from "@capacitor/core";
import { Haptics, ImpactStyle, NotificationType } from "@capacitor/haptics";

const HAPTICS_OFF_KEY = "bolt-haptics-off";

function hapticsEnabled() {
  if (!Capacitor.isNativePlatform()) return false;
  try {
    return localStorage.getItem(HAPTICS_OFF_KEY) !== "1";
  } catch {
    return true;
  }
}

/** Light tap feedback for button presses. No-op on web / when disabled. */
export async function hapticPress() {
  if (!hapticsEnabled()) return;
  try {
    await Haptics.impact({ style: ImpactStyle.Light });
  } catch {
    /* ignore */
  }
}

/** Success buzz for rewarding moments (e.g. claiming a daily reward). */
export async function hapticSuccess() {
  if (!hapticsEnabled()) return;
  try {
    await Haptics.notification({ type: NotificationType.Success });
  } catch {
    /* ignore */
  }
}

/** Native shell: status bar, splash, Android back → pause/hero select */
export async function initNativeShell(onBack: () => void) {
  if (!Capacitor.isNativePlatform()) return;

  try {
    await StatusBar.setOverlaysWebView({ overlay: true });
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: "#14532d" });
  } catch {
    /* web */
  }

  CapApp.addListener("backButton", () => {
    onBack();
  });
}

export async function hideSplashWhenReady() {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await SplashScreen.hide();
  } catch {
    /* ignore */
  }
}
