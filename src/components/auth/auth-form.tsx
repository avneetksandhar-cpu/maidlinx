"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSupabase } from "@/components/providers/supabase-provider";
import { OAuthButtons, OAuthDivider } from "@/components/auth/oauth-buttons";
import { Button, Input, Label, Text } from "@/components/ui";
import { isBookingAuthReturn } from "@/lib/bookings/booking-auth";
import { routes } from "@/config/site";
import Link from "next/link";

type AuthMode = "sign-in" | "sign-up";

interface AuthFormProps {
  mode: AuthMode;
}

function buildAuthHref(base: string, role: string, next: string, fromBooking: boolean) {
  const params = new URLSearchParams();
  if (role === "cleaner") params.set("role", "cleaner");
  if (next) params.set("next", next);
  if (fromBooking) params.set("from", "booking");
  const qs = params.toString();
  return qs ? `${base}?${qs}` : base;
}

export function AuthForm({ mode }: AuthFormProps) {
  const supabase = useSupabase();
  const router = useRouter();
  const searchParams = useSearchParams();
  const roleParam = searchParams?.get("role");
  const nextParam = searchParams?.get("next") ?? "";
  const fromBooking = isBookingAuthReturn(searchParams?.get("from"));
  const signupRole =
    roleParam === "cleaner" ||
    nextParam.startsWith("/cleaner") ||
    nextParam.startsWith("/pro")
      ? "cleaner"
      : "customer";
  const defaultNext =
    signupRole === "cleaner" ? routes.cleanerApplication : routes.account;
  const nextPath = nextParam || defaultNext;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [loading, setLoading] = useState(false);
  const [magicLoading, setMagicLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPasswordForm, setShowPasswordForm] = useState(!fromBooking);

  const submitLabel = mode === "sign-in" ? "Sign in" : "Create account";
  const alternateHref = buildAuthHref(
    mode === "sign-in" ? routes.signUp : routes.signIn,
    signupRole,
    nextPath,
    fromBooking,
  );
  const alternateLabel =
    mode === "sign-in" ? "Need an account? Sign up" : "Already have an account? Sign in";

  const passwordDisabled = useMemo(
    () =>
      !supabase ||
      !email ||
      !password ||
      (mode === "sign-up" && signupRole === "cleaner" && (!firstName || !lastName)),
    [supabase, email, password, mode, firstName, lastName, signupRole],
  );

  async function finalizeCleanerApplicant() {
    if (signupRole !== "cleaner") return;
    const res = await fetch("/api/auth/cleaner-applicant", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ explicit: true, next: nextPath }),
    });
    const json = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) {
      throw new Error(json.error ?? "Could not start cleaner application.");
    }
  }

  async function handleMagicLink() {
    if (!supabase) {
      setError("Sign-in is temporarily unavailable. Please try again shortly.");
      return;
    }
    if (!email.trim()) {
      setError("Enter your email to get a sign-in link.");
      return;
    }

    setMagicLoading(true);
    setError(null);
    setMessage(null);

    try {
      const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`;
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: redirectTo,
          shouldCreateUser: true,
          data: {
            role: signupRole,
            ...(firstName.trim() ? { first_name: firstName.trim() } : {}),
            ...(lastName.trim() ? { last_name: lastName.trim() } : {}),
          },
        },
      });
      if (otpError) throw otpError;
      setMessage("Check your email for a sign-in link. Your address is saved — you’ll continue where you left off.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send sign-in link.");
    } finally {
      setMagicLoading(false);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // Enter on email → magic link when password path is collapsed (booking friction).
    if (signupRole === "customer" && !showPasswordForm) {
      await handleMagicLink();
      return;
    }
    if (!supabase) {
      setError("Sign-in is temporarily unavailable. Please try again shortly.");
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (mode === "sign-in") {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
        await finalizeCleanerApplicant();
        router.push(nextPath);
        router.refresh();
        return;
      }

      const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`;
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectTo,
          data: {
            first_name: firstName || undefined,
            last_name: lastName || undefined,
            role: signupRole,
          },
        },
      });
      if (signUpError) throw signUpError;

      if (data.session) {
        await finalizeCleanerApplicant();
        router.push(nextPath);
        router.refresh();
        return;
      }

      setMessage(
        signupRole === "cleaner"
          ? "Check your email to confirm your account. After confirming you’ll continue to the cleaner application."
          : fromBooking
            ? "Check your email to confirm — then you’ll continue your booking."
            : "Check your email to confirm your account, then sign in.",
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed.");
    } finally {
      setLoading(false);
    }
  }

  if (!supabase) {
    if (process.env.NODE_ENV === "development") {
      console.error(
        "[Auth] NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY missing — auth disabled.",
      );
    }
    return (
      <div className="rounded-lg border border-border bg-surface-muted px-4 py-3 text-sm text-ink-muted">
        Sign-in is temporarily unavailable. Please try again shortly.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {fromBooking && signupRole === "customer" ? (
        <p className="rounded-2xl border border-[var(--ml-dark-border)] bg-[var(--ml-dark-surface)] px-4 py-3 text-sm leading-snug text-[var(--ml-dark-ink-muted)]">
          Sign in to save this property and track your cleaner. Takes a few seconds —
          your address stays saved.
        </p>
      ) : null}

      {signupRole === "cleaner" ? (
        <p className="rounded-xl border border-[var(--ml-dark-border)] bg-[var(--ml-dark-surface)] px-3 py-2 text-sm text-[var(--ml-dark-ink-muted)]">
          Cleaner apply · create account → application → pending review → approved jobs
        </p>
      ) : null}

      <OAuthButtons role={signupRole} nextPath={nextPath} size="lg" />
      <OAuthDivider />

      {/* Simplest email path: magic link (customers in booking flow get this first) */}
      {signupRole === "customer" ? (
        <div className="space-y-3">
          <div>
            <Label htmlFor="email" required>
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
              placeholder="you@email.com"
            />
          </div>
          <Button
            type="button"
            variant="accent"
            fullWidth
            className="h-12 rounded-2xl text-[15px] font-semibold"
            disabled={magicLoading || !email.trim()}
            onClick={() => void handleMagicLink()}
          >
            {magicLoading ? "Sending link…" : "Email me a sign-in link"}
          </Button>
        </div>
      ) : null}

      {signupRole === "customer" && !showPasswordForm ? (
        <button
          type="button"
          className="w-full text-center text-sm font-medium text-[var(--ml-dark-ink-muted)] underline-offset-4 hover:text-[var(--ml-dark-mint)] hover:underline"
          onClick={() => setShowPasswordForm(true)}
        >
          Use password instead
        </button>
      ) : null}

      {showPasswordForm || signupRole === "cleaner" ? (
        <div className="space-y-4">
          {mode === "sign-up" && (signupRole === "cleaner" || showPasswordForm) ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="firstName" required={signupRole === "cleaner"}>
                  First name
                </Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(event) => setFirstName(event.target.value)}
                  autoComplete="given-name"
                  required={signupRole === "cleaner"}
                />
              </div>
              <div>
                <Label htmlFor="lastName" required={signupRole === "cleaner"}>
                  Last name
                </Label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(event) => setLastName(event.target.value)}
                  autoComplete="family-name"
                  required={signupRole === "cleaner"}
                />
              </div>
            </div>
          ) : null}

          {signupRole === "cleaner" ? (
            <div>
              <Label htmlFor="email-cleaner" required>
                Email
              </Label>
              <Input
                id="email-cleaner"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                required
              />
            </div>
          ) : null}

          <div>
            <Label htmlFor="password" required>
              Password
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
              minLength={8}
              required={showPasswordForm || signupRole === "cleaner"}
            />
          </div>

          <Button type="submit" fullWidth disabled={passwordDisabled || loading}>
            {loading ? "Please wait…" : submitLabel}
          </Button>
        </div>
      ) : null}

      {error ? <p className="text-sm text-error">{error}</p> : null}
      {message ? <p className="text-sm text-ink-muted">{message}</p> : null}

      <Text muted className="text-center text-sm">
        <Link href={alternateHref} className="font-medium text-accent hover:text-accent-hover">
          {alternateLabel}
        </Link>
      </Text>
    </form>
  );
}

export function AuthFormHeading({ mode }: AuthFormProps) {
  return mode === "sign-in" ? "Sign in" : "Create your account";
}
