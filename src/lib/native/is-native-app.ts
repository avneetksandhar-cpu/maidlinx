/**
 * Detect Capacitor native shell vs browser website.
 * Capacitor loads https://www.maidlinx.com in WKWebView — same Next.js,
 * so UI gates must not rely on URL alone.
 */

export function isCapacitorNative(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const cap = (
      window as Window & {
        Capacitor?: { isNativePlatform?: () => boolean; getPlatform?: () => string };
      }
    ).Capacitor;
    if (cap?.isNativePlatform?.()) return true;
    if (cap?.getPlatform?.() === "ios" || cap?.getPlatform?.() === "android") return true;
  } catch {
    /* ignore */
  }
  return false;
}

/** Display-mode standalone / iOS home-screen PWA (secondary signal). */
export function isStandaloneDisplay(): boolean {
  if (typeof window === "undefined") return false;
  try {
    if (window.matchMedia("(display-mode: standalone)").matches) return true;
    const nav = window.navigator as Navigator & { standalone?: boolean };
    if (nav.standalone === true) return true;
  } catch {
    /* ignore */
  }
  return false;
}

/** True when running as installed app (Capacitor or standalone). */
export function isNativeApp(): boolean {
  return isCapacitorNative() || isStandaloneDisplay();
}
