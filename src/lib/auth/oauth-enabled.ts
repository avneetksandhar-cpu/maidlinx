import type { OAuthProvider } from "@/lib/auth/oauth";

/**
 * Google is the default customer social login (UI + PKCE start are shipped).
 * Live consent still requires Google Cloud + Supabase Google provider secrets —
 * see docs/OAUTH_SETUP.md. Set NEXT_PUBLIC_OAUTH_GOOGLE_ENABLED=false to hide.
 *
 * Apple stays opt-in until Services ID / key are configured
 * (NEXT_PUBLIC_OAUTH_APPLE_ENABLED=true).
 */
export function isOAuthProviderEnabled(provider: OAuthProvider): boolean {
  if (provider === "google") {
    return process.env.NEXT_PUBLIC_OAUTH_GOOGLE_ENABLED !== "false";
  }
  if (provider === "apple") {
    return process.env.NEXT_PUBLIC_OAUTH_APPLE_ENABLED === "true";
  }
  return false;
}

export function getEnabledOAuthProviders(): OAuthProvider[] {
  // Google first for customers; Apple only when explicitly enabled.
  return (["google", "apple"] as const).filter(isOAuthProviderEnabled);
}
