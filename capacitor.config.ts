import type { CapacitorConfig } from "@capacitor/cli";

/**
 * MaidLinx iOS shell — remote URL wrapper around production Next.js.
 * Does not static-export the app; Cap loads https://www.maidlinx.com.
 * Stripe LIVE stays OFF until founder approval.
 */
const config: CapacitorConfig = {
  appId: "com.maidlinx.app",
  appName: "MaidLinx",
  webDir: "native/www",
  backgroundColor: "#0a0c0b",
  server: {
    url: "https://www.maidlinx.com",
    cleartext: false,
    allowNavigation: ["www.maidlinx.com", "maidlinx.com", "*.maidlinx.com"],
  },
  ios: {
    contentInset: "automatic",
    backgroundColor: "#0a0c0b",
    preferredContentMode: "mobile",
    scheme: "MaidLinx",
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      launchAutoHide: true,
      backgroundColor: "#0a0c0b",
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#0a0c0b",
    },
  },
};

export default config;
