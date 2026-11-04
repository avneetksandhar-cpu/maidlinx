"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CalendarDays, ChevronLeft } from "lucide-react";
import { useSupabase } from "@/components/providers/supabase-provider";
import { OAuthButtons, OAuthDivider } from "@/components/auth/oauth-buttons";
import { getEnabledOAuthProviders } from "@/lib/auth/oauth-enabled";
import {
  BOOKING_RESUME_AFTER_AUTH,
  isBookingAuthReturn,
} from "@/lib/bookings/booking-auth";
import {
  BOOKING_STATE_STORAGE_KEY,
  DEFAULT_BOOKING_STATE,
  type BookingState,
} from "@/lib/bookings/booking-state";
import {
  formatBookingDateShort,
  formatWindowRangeShort,
} from "@/lib/bookings/arrival-labels";
import { getBookingServiceLabel } from "@/lib/bookings/constants";
import { safeAuthNextPath } from "@/lib/auth/oauth";
import { routes } from "@/config/site";

function readDraft(): BookingState {
  if (typeof window === "undefined") return DEFAULT_BOOKING_STATE;
  try {
    const raw = sessionStorage.getItem(BOOKING_STATE_STORAGE_KEY);
    if (!raw) return DEFAULT_BOOKING_STATE;
    return { ...DEFAULT_BOOKING_STATE, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_BOOKING_STATE;
  }
}

function serviceLabel(state: BookingState): string {
  if (state.serviceTierId === "standard" || state.serviceType === "standard") {
    return "Standard clean";
  }
  if (state.serviceTierId === "deep" || state.serviceType === "deep") {
    return "Deep clean";
  }
  if (state.serviceType) return getBookingServiceLabel(state.serviceType);
  return "Your clean";
}

function visitReminder(state: BookingState): string {
  const date = formatBookingDateShort(state.date);
  const window = formatWindowRangeShort(state.arrivalWindow);
  const parts = [date !== "—" ? date : null, window !== "—" ? window : null].filter(Boolean);
  if (parts.length === 0) return serviceLabel(state);
  return `${serviceLabel(state)} · ${parts.join(" · ")}`;
}

/**
 * Booking-auth gate — “Save your booking”. Compact mark, one-line visit reminder,
 * only working auth methods. Never creates a booking or charges a card.
 */
export function BookingSaveSignIn() {
  const supabase = useSupabase();
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = safeAuthNextPath(
    searchParams?.get("next"),
    BOOKING_RESUME_AFTER_AUTH,
  );
  const fromBooking = isBookingAuthReturn(searchParams?.get("from"));
  const backHref = fromBooking ? BOOKING_RESUME_AFTER_AUTH.replace("/review", "/date") : routes.bookDate;

  const [draft, setDraft] = useState<BookingState>(DEFAULT_BOOKING_STATE);
  const [email, setEmail] = useState("");
  const [magicLoading, setMagicLoading] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setDraft(readDraft());
  }, []);

  const oauthEnabled = getEnabledOAuthProviders();
  const reminder = useMemo(() => visitReminder(draft), [draft]);
  const summaryPrimary = serviceLabel(draft);
  const summarySecondary = [
    formatBookingDateShort(draft.date),
    formatWindowRangeShort(draft.arrivalWindow),
  ]
    .filter((x) => x && x !== "—")
    .join(" · ");

  async function sendMagicLink(targetEmail: string) {
    if (!supabase) {
      setError("Sign-in is temporarily unavailable. Please try again shortly.");
      return;
    }
    const trimmed = targetEmail.trim();
    if (!trimmed) {
      setError("Enter your email to get a sign-in link.");
      return;
    }

    setMagicLoading(true);
    setError(null);
    try {
      const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`;
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: trimmed,
        options: {
          emailRedirectTo: redirectTo,
          shouldCreateUser: true,
          data: { role: "customer" },
        },
      });
      if (otpError) throw otpError;
      setSentTo(trimmed);
      setEmail(trimmed);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send sign-in link.");
    } finally {
      setMagicLoading(false);
    }
  }

  if (sentTo) {
    return (
      <div
        data-theme="ml-dark"
        className="mx-auto flex min-h-dvh w-full max-w-[390px] flex-col bg-[#01193D] px-5 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(1.25rem,env(safe-area-inset-bottom))] text-white"
        style={{ fontFamily: "var(--ml-font-ios)" }}
      >
        <button
          type="button"
          onClick={() => setSentTo(null)}
          className="inline-flex items-center gap-1 self-start py-2 text-[15px] font-medium text-white/90"
        >
          <ChevronLeft className="size-5" strokeWidth={2.25} aria-hidden />
          Back
        </button>

        <div className="mt-6 flex flex-col items-center">
          <Image
            src="/brand/maidlinx-mark.png"
            alt="MaidLinx"
            width={48}
            height={48}
            className="size-12 rounded-full object-cover"
            priority
          />
        </div>

        <h1 className="booking-step-title mt-6 text-center text-white">Check your email</h1>
        <p className="mt-2 text-center text-[16px] leading-relaxed text-white/80">
          We sent a sign-in link to <span className="font-semibold text-white">{sentTo}</span>.
          Open it on this phone to continue your booking — nothing is charged yet.
        </p>

        <button
          type="button"
          disabled={magicLoading}
          onClick={() => void sendMagicLink(sentTo)}
          className="booking-cta-btn mt-8 inline-flex h-12 w-full items-center justify-center rounded-xl bg-[#04CED2] text-[15px] font-bold text-[#01193D] disabled:opacity-60"
        >
          {magicLoading ? "Sending…" : "Resend link"}
        </button>
        <button
          type="button"
          onClick={() => {
            setSentTo(null);
            setEmail(sentTo);
          }}
          className="mt-3 text-center text-sm font-medium text-white/70 underline-offset-2 hover:underline"
        >
          Use a different email
        </button>

        <p className="mt-auto pt-8 text-center text-xs text-white/50">
          Your address, extras, and time stay saved on this device.
        </p>
      </div>
    );
  }

  return (
    <div
      data-theme="ml-dark"
      className="mx-auto flex min-h-dvh w-full max-w-[390px] flex-col bg-[#01193D] px-5 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(1.25rem,env(safe-area-inset-bottom))] text-white"
      style={{ fontFamily: "var(--ml-font-ios)" }}
    >
      <div className="flex items-center justify-between gap-3">
        <Link
          href={backHref}
          className="inline-flex items-center gap-1 py-2 text-[15px] font-medium text-white/90"
        >
          <ChevronLeft className="size-5" strokeWidth={2.25} aria-hidden />
          Back to booking
        </Link>
      </div>

      <div className="mt-2 flex flex-col items-center">
        <Image
          src="/brand/maidlinx-mark.png"
          alt="MaidLinx"
          width={48}
          height={48}
          className="size-12 rounded-full object-cover"
          priority
        />
      </div>

      <h1 className="booking-step-title mt-5 text-center text-white">Save your booking</h1>
      <p className="mt-2 text-center text-[16px] leading-relaxed text-white/80">
        Sign in to confirm your clean and get arrival updates.
      </p>

      {/* Single-line visit reminder — shrink competing chrome */}
      <div className="mt-5 flex items-center gap-3 rounded-xl bg-[#102B49] px-3.5 py-3">
        <CalendarDays className="size-5 shrink-0 text-white/80" strokeWidth={1.75} aria-hidden />
        <div className="min-w-0">
          <p className="truncate text-[15px] font-semibold text-white">{summaryPrimary}</p>
          {summarySecondary ? (
            <p className="truncate text-[14px] text-white/70">{summarySecondary}</p>
          ) : (
            <p className="truncate text-[14px] text-white/70">{reminder}</p>
          )}
        </div>
      </div>

      <div className="mt-6 space-y-3">
        <OAuthButtons
          role="customer"
          nextPath={nextPath}
          variant="booking-save"
        />
        {oauthEnabled.length > 0 ? <OAuthDivider /> : null}

        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            void sendMagicLink(email);
          }}
        >
          <div>
            <label htmlFor="booking-save-email" className="mb-1.5 block text-sm font-medium text-white">
              Email address
            </label>
            <input
              id="booking-save-email"
              type="email"
              autoComplete="email"
              inputMode="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="h-12 w-full rounded-xl border border-white/70 bg-transparent px-3.5 text-[16px] text-white placeholder:text-white/40 focus:border-[#04CED2] focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={magicLoading || !email.trim()}
            className="booking-cta-btn inline-flex h-12 w-full items-center justify-center rounded-xl bg-[#04CED2] text-[15px] font-bold text-[#01193D] disabled:opacity-60"
          >
            {magicLoading ? "Sending link…" : "Email me a sign-in link"}
          </button>
          <p className="text-center text-sm text-white/75">No password needed.</p>
        </form>

        {error ? (
          <p className="text-center text-sm text-red-300" role="alert">
            {error}
          </p>
        ) : null}
      </div>

      <div className="mt-auto flex gap-4 pt-10 text-sm text-white/80">
        <Link href={routes.legal.terms} className="underline underline-offset-2">
          Terms
        </Link>
        <Link href={routes.legal.privacy} className="underline underline-offset-2">
          Privacy
        </Link>
      </div>

      {/* Dev-only escape if already signed in mid-flow */}
      <button
        type="button"
        className="sr-only"
        onClick={() => {
          router.push(nextPath);
          router.refresh();
        }}
      >
        Continue
      </button>
    </div>
  );
}
