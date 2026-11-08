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
  const from = searchParams.get("from");
  const redirectTo = buildOAuthRedirectTo(origin, {
    next,
    role,
    from: from === "booking" ? "booking" : null,
  });

  const signInErrorUrl = (message: string) => {
    const params = new URLSearchParams();
    params.set("error", message);
    params.set("next", next);
    if (role === "cleaner") params.set("role", "cleaner");
    if (from === "booking") params.set("from", "booking");
    return new URL(`/sign-in?${params.toString()}`, origin);
  };

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
    return NextResponse.redirect(
      signInErrorUrl(error?.message ?? "oauth_start_failed"),
    );
  }

  return NextResponse.redirect(data.url);
}
