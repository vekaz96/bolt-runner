import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.kidsvolt.bolt",
  appName: "Bolt Runner",
  webDir: "dist",
  server: {
    androidScheme: "https",
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 500,
      backgroundColor: "#14532d",
      showSpinner: false,
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#14532d",
      overlaysWebView: true,
    },
  },
};

export default config;
