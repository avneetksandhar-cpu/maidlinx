import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  buildOAuthRedirectTo,
  isOAuthProvider,
  oauthRoleFromParams,
  safeAuthNextPath,
} from "@/lib/auth/oauth";
import { hasSupabaseEnv } from "@/config/env";

/**
 * GET /api/auth/oauth/google|apple?next=/account&role=cleaner
 * Starts Supabase PKCE OAuth and redirects to the provider.
 * Cookies (code verifier) are set on this response via the SSR client.
 */
export async function GET(
  request: Request,
  context: { params: Promise<{ provider: string }> },
) {
  const { provider: raw } = await context.params;
  if (!isOAuthProvider(raw)) {
    return NextResponse.json({ error: "Unsupported OAuth provider." }, { status: 400 });
  }

  if (!hasSupabaseEnv()) {
    return NextResponse.redirect(
      new URL("/sign-in?error=auth_not_configured", request.url),
    );
  }

  const { searchParams, origin } = new URL(request.url);
  const next = safeAuthNextPath(searchParams.get("next"), "/account");
  const role = oauthRoleFromParams({
    role: searchParams.get("role"),
    next,
  });
  const redirectTo = buildOAuthRedirectTo(origin, { next, role });

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: raw,
    options: {
      redirectTo,
      skipBrowserRedirect: true,
      queryParams:
        raw === "google"
          ? {
              access_type: "offline",
              prompt: "select_account",
            }
          : undefined,
    },
  });

  if (error || !data.url) {
    const message = encodeURIComponent(error?.message ?? "oauth_start_failed");
    return NextResponse.redirect(new URL(`/sign-in?error=${message}`, origin));
  }

  return NextResponse.redirect(data.url);
}
