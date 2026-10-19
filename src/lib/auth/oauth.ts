/**
 * MaidLinx Supabase Auth social providers (Google + Apple).
 * Secrets live in the Supabase dashboard — never commit client secrets.
 */

export const OAUTH_PROVIDERS = ["google", "apple"] as const;
export type OAuthProvider = (typeof OAUTH_PROVIDERS)[number];

export function isOAuthProvider(value: string): value is OAuthProvider {
  return (OAUTH_PROVIDERS as readonly string[]).includes(value);
}

/** Safe in-app path for post-auth redirect (blocks open redirects). */
export function safeAuthNextPath(next: string | null | undefined, fallback = "/account"): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.includes("://")) {
    return fallback;
  }
  return next;
}

export function oauthRoleFromParams(input: {
  role?: string | null;
  next?: string | null;
}): "cleaner" | "customer" {
  if (input.role === "cleaner") return "cleaner";
  const next = input.next ?? "";
  if (next.startsWith("/cleaner") || next.startsWith("/pro")) return "cleaner";
  return "customer";
}

/**
 * Build the Supabase `redirectTo` for PKCE OAuth.
 * Role is carried in the query so /auth/callback can promote cleaner applicants.
 */
export function buildOAuthRedirectTo(
  origin: string,
  input: { next?: string | null; role?: string | null },
): string {
  const next = safeAuthNextPath(input.next, "/account");
  const role = oauthRoleFromParams({ role: input.role, next });
  const params = new URLSearchParams();
  params.set("next", next);
  if (role === "cleaner") params.set("role", "cleaner");
  return `${origin.replace(/\/$/, "")}/auth/callback?${params.toString()}`;
}

/**
 * Redirect URLs that must be allow-listed in Supabase Auth → URL Configuration.
 * Founder pastes these; do not invent project-specific secrets here.
 */
export const SUPABASE_OAUTH_REDIRECT_ALLOWLIST = [
  "http://127.0.0.1:3001/auth/callback",
  "http://127.0.0.1:3001/**",
  "http://localhost:3001/auth/callback",
  "http://localhost:3001/**",
  "https://maidlinx.com/auth/callback",
  "https://maidlinx.com/**",
  "https://www.maidlinx.com/auth/callback",
  "https://www.maidlinx.com/**",
  // Vercel preview deployments for this GitHub project
  "https://*-maidlinx.vercel.app/auth/callback",
  "https://*-maidlinx.vercel.app/**",
  "https://website-*-maidlinx.vercel.app/**",
] as const;
