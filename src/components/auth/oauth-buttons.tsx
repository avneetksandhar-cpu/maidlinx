"use client";

import { useState } from "react";
import { useSupabase } from "@/components/providers/supabase-provider";
import { buildOAuthRedirectTo, type OAuthProvider } from "@/lib/auth/oauth";

interface OAuthButtonsProps {
  /** customer | cleaner — preserved through OAuth callback */
  role: "customer" | "cleaner";
  nextPath: string;
  /** Large mint/dark CTAs for booking gate (default). */
  size?: "md" | "lg";
}

function GoogleGlyph({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        opacity="0.9"
      />
      <path
        fill="currentColor"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        opacity="0.75"
      />
      <path
        fill="currentColor"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        opacity="0.85"
      />
      <path
        fill="currentColor"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        opacity="0.7"
      />
    </svg>
  );
}

function AppleGlyph({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M16.365 1.43c0 1.14-.42 2.2-1.18 3.03-.79.87-2.1 1.54-3.22 1.45-.14-1.1.4-2.26 1.14-3.05.8-.87 2.2-1.52 3.26-1.43zM20.9 17.2c-.55 1.27-.82 1.84-1.54 2.96-1 1.5-2.41 3.37-4.16 3.39-1.56.02-1.96-1.02-4.08-1-2.12.02-2.56 1.03-4.12 1.01-1.74-.02-3.07-1.7-4.07-3.2-2.8-4.2-3.1-9.14-1.37-11.74 1.22-1.84 3.15-2.92 4.96-2.92 1.85 0 3.01 1.02 4.54 1.02 1.48 0 2.38-1.03 4.52-1.03 1.61 0 3.31.88 4.52 2.4-3.97 2.18-3.33 7.86.8 9.11z"
      />
    </svg>
  );
}

const rowClassMd =
  "flex w-full items-center justify-center gap-3 rounded-2xl border border-[var(--ml-dark-border-strong)] bg-[var(--ml-dark-surface)] px-4 py-3.5 text-[15px] font-semibold text-[var(--ml-dark-ink)] transition-colors hover:border-[var(--ml-dark-mint)] hover:bg-[var(--ml-dark-surface-2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ml-dark-mint)]/50 disabled:cursor-not-allowed disabled:opacity-60";

const rowClassLg =
  "flex h-14 w-full items-center justify-center gap-3 rounded-2xl border border-[var(--ml-dark-border-strong)] bg-[var(--ml-dark-surface)] px-4 text-base font-semibold text-[var(--ml-dark-ink)] shadow-[0_0_20px_rgb(8_224_212_/_0.12)] transition-colors hover:border-[var(--ml-dark-mint)] hover:bg-[var(--ml-dark-surface-2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ml-dark-mint)]/50 disabled:cursor-not-allowed disabled:opacity-60";

export function OAuthButtons({ role, nextPath, size = "lg" }: OAuthButtonsProps) {
  const rowClass = size === "lg" ? rowClassLg : rowClassMd;
  const supabase = useSupabase();
  const [loading, setLoading] = useState<OAuthProvider | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function startOAuth(provider: OAuthProvider) {
    setError(null);
    setLoading(provider);

    // Prefer server route so PKCE verifier cookies are set on the redirect response.
    const params = new URLSearchParams();
    params.set("next", nextPath);
    if (role === "cleaner") params.set("role", "cleaner");
    const serverStart = `/api/auth/oauth/${provider}?${params.toString()}`;

    try {
      if (!supabase) {
        window.location.assign(serverStart);
        return;
      }

      const redirectTo = buildOAuthRedirectTo(window.location.origin, {
        next: nextPath,
        role,
      });

      const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo,
          skipBrowserRedirect: true,
          queryParams:
            provider === "google"
              ? { access_type: "offline", prompt: "select_account" }
              : undefined,
        },
      });

      if (oauthError || !data.url) {
        // Provider may be disabled in Supabase — fall back to server start for a clear error.
        window.location.assign(serverStart);
        return;
      }

      window.location.assign(data.url);
    } catch {
      window.location.assign(serverStart);
    }
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        className={rowClass}
        disabled={loading !== null}
        onClick={() => void startOAuth("google")}
        data-testid="oauth-google"
      >
        <GoogleGlyph className="size-5 text-[var(--ml-dark-mint)]" />
        {loading === "google" ? "Connecting Google…" : "Continue with Google"}
      </button>

      <button
        type="button"
        className={rowClass}
        disabled={loading !== null}
        onClick={() => void startOAuth("apple")}
        data-testid="oauth-apple"
      >
        <AppleGlyph className="size-5 text-[var(--ml-dark-mint)]" />
        {loading === "apple" ? "Connecting Apple…" : "Continue with Apple"}
      </button>

      {error ? <p className="text-sm text-error">{error}</p> : null}
    </div>
  );
}

export function OAuthDivider() {
  return (
    <div className="flex items-center gap-3 py-1" aria-hidden="true">
      <div className="h-px flex-1 bg-[var(--ml-dark-border)]" />
      <span className="text-xs font-medium tracking-wide text-[var(--ml-dark-ink-subtle)] uppercase">
        or
      </span>
      <div className="h-px flex-1 bg-[var(--ml-dark-border)]" />
    </div>
  );
}
