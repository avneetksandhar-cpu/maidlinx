import type { OAuthProvider } from "@/lib/auth/oauth";

/**
 * Only show OAuth buttons when the founder has flipped the public enable flag.
 * Secrets still live in Supabase — these flags gate UI so customers never tap a
 * broken Apple/Google row (see docs/OAUTH_SETUP.md · SECRETS_PENDING).
 */
export function isOAuthProviderEnabled(provider: OAuthProvider): boolean {
  if (provider === "google") {
    return process.env.NEXT_PUBLIC_OAUTH_GOOGLE_ENABLED === "true";
  }
  if (provider === "apple") {
    return process.env.NEXT_PUBLIC_OAUTH_APPLE_ENABLED === "true";
  }
  return false;
}

export function getEnabledOAuthProviders(): OAuthProvider[] {
  return (["apple", "google"] as const).filter(isOAuthProviderEnabled);
}
