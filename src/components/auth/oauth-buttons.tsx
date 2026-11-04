"use client";

import { useState } from "react";
import { useSupabase } from "@/components/providers/supabase-provider";
import { buildOAuthRedirectTo, type OAuthProvider } from "@/lib/auth/oauth";
import { getEnabledOAuthProviders } from "@/lib/auth/oauth-enabled";

interface OAuthButtonsProps {
  /** customer | cleaner — preserved through OAuth callback */
  role: "customer" | "cleaner";
  nextPath: string;
  /** Large mint/dark CTAs for booking gate (default). */
  size?: "md" | "lg";
  /** Compact outline rows for Save-your-booking (no competing weight). */
  variant?: "default" | "booking-save";
}

function GoogleGlyph({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M12 10.2v3.6h5.1c-.2 1.2-.9 2.2-1.9 2.9l3.1 2.4c1.8-1.7 2.9-4.1 2.9-7 0-.7-.1-1.3-.2-1.9H12z"
      />
      <path
        fill="#34A853"
        d="M6.6 14.3l-.7.5-2.4 1.9C5.1 19.5 8.3 21.5 12 21.5c2.5 0 4.6-.8 6.2-2.2l-3.1-2.4c-.8.6-1.9.9-3.1.9-2.4 0-4.4-1.6-5.1-3.8z"
      />
      <path
        fill="#FBBC05"
        d="M3.5 7.3C2.8 8.7 2.5 10.3 2.5 12s.3 3.3 1 4.7l3.1-2.4c-.2-.6-.3-1.2-.3-1.9 0-.7.1-1.4.3-2z"
      />
      <path
        fill="#4285F4"
        d="M12 5.2c1.4 0 2.6.5 3.6 1.4l2.7-2.7C16.6 2.4 14.5 1.5 12 1.5 8.3 1.5 5.1 3.5 3.5 7.3l3.1 2.4C7.6 6.8 9.6 5.2 12 5.2z"
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
  "flex h-14 w-full items-center justify-center gap-3 rounded-2xl border border-[var(--ml-dark-border-strong)] bg-[var(--ml-dark-surface)] px-4 text-base font-semibold text-[var(--ml-dark-ink)] transition-colors hover:border-[var(--ml-dark-mint)] hover:bg-[var(--ml-dark-surface-2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ml-dark-mint)]/50 disabled:cursor-not-allowed disabled:opacity-60";

const rowClassBookingSave =
  "flex h-12 w-full items-center justify-center gap-2.5 rounded-xl border border-white/80 bg-transparent px-4 text-[15px] font-semibold text-white transition-colors hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#04CED2]/50 disabled:cursor-not-allowed disabled:opacity-60";

export function OAuthButtons({
  role,
  nextPath,
  size = "lg",
  variant = "default",
}: OAuthButtonsProps) {
  const enabled = getEnabledOAuthProviders();
  const rowClass =
    variant === "booking-save"
      ? rowClassBookingSave
      : size === "lg"
        ? rowClassLg
        : rowClassMd;
  const supabase = useSupabase();
  const [loading, setLoading] = useState<OAuthProvider | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (enabled.length === 0) return null;

  async function startOAuth(provider: OAuthProvider) {
    setError(null);
    setLoading(provider);

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
        window.location.assign(serverStart);
        return;
      }

      window.location.assign(data.url);
    } catch {
      window.location.assign(serverStart);
    }
  }

  const label = (provider: OAuthProvider) =>
    loading === provider
      ? provider === "google"
        ? "Connecting Google…"
        : "Connecting Apple…"
      : provider === "google"
        ? "Continue with Google"
        : "Continue with Apple";

  return (
    <div className="space-y-2.5">
      {enabled.map((provider) => (
        <button
          key={provider}
          type="button"
          className={rowClass}
          disabled={loading !== null}
          onClick={() => void startOAuth(provider)}
          data-testid={`oauth-${provider}`}
        >
          {provider === "google" ? (
            <GoogleGlyph className="size-5" />
          ) : (
            <AppleGlyph className="size-5 text-white" />
          )}
          {label(provider)}
        </button>
      ))}

      {error ? <p className="text-sm text-error">{error}</p> : null}
    </div>
  );
}

export function OAuthDivider() {
  const enabled = getEnabledOAuthProviders();
  if (enabled.length === 0) return null;
  return (
    <div className="flex items-center gap-3 py-1" aria-hidden="true">
      <div className="h-px flex-1 bg-white/40" />
      <span className="text-xs font-medium tracking-wide text-white/70 lowercase">or</span>
      <div className="h-px flex-1 bg-white/40" />
    </div>
  );
}
