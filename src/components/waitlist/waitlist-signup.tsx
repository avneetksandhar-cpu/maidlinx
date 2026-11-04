"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { WaitlistReason } from "@/lib/markets/booking-availability";

export interface WaitlistSignupProps {
  reason: WaitlistReason;
  marketId?: string | null;
  marketName?: string | null;
  source: string;
  page?: string;
  className?: string;
  /** Compact = single-line email + button; default includes optional name. */
  variant?: "default" | "compact";
}

export function WaitlistSignup({
  reason,
  marketId,
  marketName,
  source,
  page,
  className,
  variant = "default",
}: WaitlistSignupProps) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const headline =
    reason === "booking_disabled"
      ? marketName
        ? `Booking isn’t open in ${marketName} yet`
        : "Booking isn’t open in your area yet"
      : "We’re not in your area yet";

  const subcopy =
    reason === "booking_disabled"
      ? "Leave your email and we’ll notify you when you can book."
      : "Join the waitlist and we’ll notify you when MaidLinx expands to you.";

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          name: name.trim() || null,
          marketId: marketId ?? null,
          source,
          page: page ?? (typeof window !== "undefined" ? window.location.pathname : null),
        }),
      });
      const json = (await res.json().catch(() => ({}))) as {
        data?: { message?: string };
        error?: string;
      };
      if (!res.ok) {
        setError(json.error ?? "Unable to join waitlist.");
        return;
      }
      setSuccess(json.data?.message ?? "You're on the list.");
      setEmail("");
      setName("");
    } catch {
      setError("Unable to join waitlist. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div
        className={cn(
          "rounded-xl border border-accent/20 bg-accent/5 px-4 py-3 text-sm text-ink",
          className,
        )}
        role="status"
      >
        <p className="font-medium text-accent">{success}</p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "space-y-3 rounded-xl border border-amber-200/80 bg-amber-50 px-4 py-3 text-sm text-amber-950",
        className,
      )}
    >
      <div>
        <p className="font-medium">{headline}</p>
        <p className="mt-1 text-amber-900/90">{subcopy}</p>
      </div>

      <form onSubmit={onSubmit} className="space-y-3">
        {variant === "default" ? (
          <div>
            <Label htmlFor={`waitlist-name-${source}`} className="text-amber-950">
              Name <span className="font-normal text-amber-900/70">(optional)</span>
            </Label>
            <Input
              id={`waitlist-name-${source}`}
              name="name"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={200}
              className="bg-white"
            />
          </div>
        ) : null}

        <div className={variant === "compact" ? "flex flex-col gap-2 sm:flex-row sm:items-end" : ""}>
          <div className="min-w-0 flex-1">
            <Label htmlFor={`waitlist-email-${source}`} className="text-amber-950" required>
              Email
            </Label>
            <Input
              id={`waitlist-email-${source}`}
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
              maxLength={320}
              className="bg-white"
            />
          </div>
          <Button
            type="submit"
            disabled={submitting || !email.trim()}
            className={variant === "compact" ? "sm:mb-0 sm:shrink-0" : "w-full sm:w-auto"}
          >
            {submitting ? "Saving…" : "Notify me"}
          </Button>
        </div>

        {error ? (
          <p className="text-sm text-error" role="alert">
            {error}
          </p>
        ) : null}
      </form>
    </div>
  );
}
