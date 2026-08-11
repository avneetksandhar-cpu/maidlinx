"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSupabase } from "@/components/providers/supabase-provider";
import { Button, Input, Label, Text } from "@/components/ui";
import { routes } from "@/config/site";
import Link from "next/link";

type AuthMode = "sign-in" | "sign-up";

interface AuthFormProps {
  mode: AuthMode;
}

export function AuthForm({ mode }: AuthFormProps) {
  const supabase = useSupabase();
  const router = useRouter();
  const searchParams = useSearchParams();
  const roleParam = searchParams?.get("role");
  const signupRole = roleParam === "cleaner" ? "cleaner" : "customer";
  const defaultNext = signupRole === "cleaner" ? routes.cleanerDashboard : routes.dashboard;
  const nextPath = searchParams?.get("next") ?? defaultNext;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const title = mode === "sign-in" ? "Sign in" : "Create your account";
  const submitLabel = mode === "sign-in" ? "Sign in" : "Create account";
  const alternateHref = mode === "sign-in" ? routes.signUp : routes.signIn;
  const alternateLabel =
    mode === "sign-in" ? "Need an account? Sign up" : "Already have an account? Sign in";

  const disabled = useMemo(
    () => !supabase || !email || !password || (mode === "sign-up" && (!firstName || !lastName)),
    [supabase, email, password, mode, firstName, lastName],
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) {
      setError("Supabase is not configured. Add credentials to .env.local.");
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
        router.push(nextPath);
        router.refresh();
        return;
      }

      const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`;
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectTo,
          data: {
            first_name: firstName,
            last_name: lastName,
            role: signupRole,
          },
        },
      });
      if (signUpError) throw signUpError;

      setMessage("Check your email to confirm your account, then sign in.");
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
      {mode === "sign-up" ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="firstName" required>
              First name
            </Label>
            <Input
              id="firstName"
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
              autoComplete="given-name"
              required
            />
          </div>
          <div>
            <Label htmlFor="lastName" required>
              Last name
            </Label>
            <Input
              id="lastName"
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
              autoComplete="family-name"
              required
            />
          </div>
        </div>
      ) : null}

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
        />
      </div>

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
          required
        />
      </div>

      {error ? <p className="text-sm text-error">{error}</p> : null}
      {message ? <p className="text-sm text-ink-muted">{message}</p> : null}

      <Button type="submit" fullWidth disabled={disabled || loading}>
        {loading ? "Please wait…" : submitLabel}
      </Button>

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
