import type { CapacitorConfig } from "@capacitor/cli";

/**
 * MaidLinx iOS shell — remote URL wrapper around production Next.js.
 * Does not static-export the app; Cap loads https://www.maidlinx.com.
 * Stripe LIVE stays OFF until founder approval.
 *
 * Native deltas beyond WKWebView (see native/APP_STORE.md):
 * - SplashScreen + StatusBar plugins
 * - Deep link URL scheme maidlinx:// (Info.plist CFBundleURLTypes)
 * - Local offline empty state in native/www (webDir fallback)
 * - Safe-area contentInset automatic
 * Push delivery is NOT implemented (capability stub docs only).
 */
const config: CapacitorConfig = {
  appId: "com.maidlinx.app",
  appName: "MaidLinx",
  webDir: "native/www",
  backgroundColor: "#0a0c0b",
  server: {
    url: "https://www.maidlinx.com",
    cleartext: false,
    allowNavigation: [
      "www.maidlinx.com",
      "maidlinx.com",
      "*.maidlinx.com",
      // Stripe Checkout / Identity hosts (TEST mode; LIVE stays OFF)
      "*.stripe.com",
      "checkout.stripe.com",
      "js.stripe.com",
      "hooks.stripe.com",
    ],
  },
  ios: {
    contentInset: "automatic",
    backgroundColor: "#0a0c0b",
    preferredContentMode: "mobile",
    // Capacitor bridge scheme (not the public deep-link scheme maidlinx://)
    scheme: "MaidLinx",
    // Do NOT set limitsNavigationsToAppBoundDomains — OAuth (Google/Apple/Supabase)
    // and Stripe Checkout must navigate to third-party hosts inside the shell.
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
      // Dark style = light content text (correct for #0a0c0b shell)
      style: "DARK",
      backgroundColor: "#0a0c0b",
    },
  },
};

export default config;
