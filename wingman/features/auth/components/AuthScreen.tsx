"use client";

import { WingmanLogo } from "@/components/brand/WingmanLogo";
import { Button } from "@/components/ui/Button";
import { AppShell } from "@/components/layout/AppShell";
import { fadeUpShort } from "@/lib/animations";
import { motion } from "framer-motion";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";

const fadeUp = fadeUpShort;

type Mode = "signin" | "signup";

function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refresh } = useAuth();
  const nextPath = searchParams.get("next") || "/home";
  const paying = nextPath.startsWith("/book");
  const [mode, setMode] = useState<Mode>(searchParams.get("mode") === "signup" ? "signup" : "signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const path = mode === "signup" ? "/api/auth/signup" : "/api/auth/login";
      const response = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          displayName: mode === "signup" ? displayName : undefined,
        }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(payload.error ?? "Something went wrong.");
        return;
      }
      await refresh();
      router.push(nextPath.startsWith("/") ? nextPath : "/home");
      router.refresh();
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell className="justify-center">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_50%_35%_at_50%_0%,rgba(200,179,139,0.08),transparent)]"
      />

      <motion.header
        initial="hidden"
        animate="visible"
        className="relative z-10 flex flex-col items-center pt-12 pb-8 text-center"
      >
        <motion.div custom={0} variants={fadeUp}>
          <Link href="/" aria-label="Wingman home" className="flex flex-col items-center">
            <WingmanLogo variant="lockup" size={112} />
            <p className="mt-3 text-sm text-accent">Your person in Miami</p>
          </Link>
        </motion.div>

        <motion.p custom={0.05} variants={fadeUp} className="text-label mt-8 text-champagne">
          {paying ? "Pay $500" : "Wingman"}
        </motion.p>

        <motion.h1 custom={0.1} variants={fadeUp} className="mt-4 font-display text-4xl text-ink">
          {paying
            ? mode === "signin"
              ? "Sign in to pay"
              : "Create an account to pay"
            : mode === "signin"
              ? "Sign in"
              : "Create your account"}
        </motion.h1>
      </motion.header>

      <motion.form
        initial="hidden"
        animate="visible"
        custom={0.2}
        variants={fadeUp}
        onSubmit={onSubmit}
        className="relative z-10 flex flex-col gap-3"
      >
        {mode === "signup" ? (
          <label className="block text-left">
            <span className="mb-1.5 block text-[11px] uppercase tracking-[0.18em] text-ink-subtle">Name</span>
            <input
              name="displayName"
              autoComplete="name"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              className="h-12 w-full rounded-full border border-border bg-surface px-4 text-sm text-ink outline-none focus:border-accent/50"
            />
          </label>
        ) : null}

        <label className="block text-left">
          <span className="mb-1.5 block text-[11px] uppercase tracking-[0.18em] text-ink-subtle">Email</span>
          <input
            type="email"
            name="email"
            required
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="h-12 w-full rounded-full border border-border bg-surface px-4 text-sm text-ink outline-none focus:border-accent/50"
          />
        </label>

        <label className="block text-left">
          <span className="mb-1.5 block text-[11px] uppercase tracking-[0.18em] text-ink-subtle">Password</span>
          <input
            type="password"
            name="password"
            required
            minLength={10}
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="h-12 w-full rounded-full border border-border bg-surface px-4 text-sm text-ink outline-none focus:border-accent/50"
          />
        </label>

        {error ? (
          <p role="alert" className="text-sm text-red-400">
            {error}
          </p>
        ) : null}

        <Button type="submit" size="lg" fullWidth loading={loading} className="mt-2">
          {paying ? (mode === "signin" ? "Sign in and pay $500" : "Create account and pay") : mode === "signin" ? "Sign in" : "Create account"}
        </Button>

        {mode === "signin" ? (
          <p className="text-center text-sm text-ink-muted">
            <Link href="/auth/reset" className="text-cobalt underline-offset-2 hover:underline">
              Forgot password?
            </Link>
          </p>
        ) : null}
      </motion.form>

      <p className="relative z-10 mt-6 pb-4 text-center text-sm text-ink-muted">
        {mode === "signin" ? "New here?" : "Already a member?"}{" "}
        <button
          type="button"
          className="font-medium text-[#c8b38b] underline-offset-2 hover:underline"
          onClick={() => {
            setMode(mode === "signin" ? "signup" : "signin");
            setError(null);
          }}
        >
          {mode === "signin" ? "Create an account" : "Sign in"}
        </button>
      </p>
      <p className="relative z-10 pb-8 text-center text-[11px] text-ink-subtle">
        <Link href="/legal/privacy" className="underline-offset-2 hover:underline">
          Privacy Policy
        </Link>
        {" · "}
        <Link href="/legal/terms" className="underline-offset-2 hover:underline">
          Terms
        </Link>
      </p>
    </AppShell>
  );
}

export function AuthScreen() {
  return (
    <Suspense
      fallback={
        <AppShell className="justify-center">
          <p className="text-sm text-ink-muted">Loading…</p>
        </AppShell>
      }
    >
      <AuthForm />
    </Suspense>
  );
}
