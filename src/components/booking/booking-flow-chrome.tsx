"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui";
import {
  BOOKING_SCREEN_PATHS,
  getPreviousScreen,
  type BookingScreenId,
} from "@/lib/bookings/booking-routes";
import { useBooking } from "@/components/booking/booking-provider";
import { buildQuoteInput } from "@/lib/bookings/booking-helpers";
import { useBookingPricing } from "@/hooks/use-booking-pricing";
import { cn, formatCurrency } from "@/lib/utils";
import { routes } from "@/config/site";

interface BookingFlowChromeProps {
  screenId: BookingScreenId;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  /** Hide bottom CTA (auto-advance screens, or custom footer). */
  hideCta?: boolean;
  ctaLabel?: string;
  ctaDisabled?: boolean;
  ctaLoading?: boolean;
  onContinue?: () => void;
  /** Extra content above the sticky CTA (e.g. running total). */
  footerHint?: React.ReactNode;
  className?: string;
  /** Optional location row under the title (category screen). */
  locationSlot?: React.ReactNode;
  /** Override back destination (e.g. return to review after edit). */
  backHref?: string | null;
  /** Hide estimated total row when custom footerHint is enough. */
  hideDefaultTotal?: boolean;
}

/** Founder 4 panels: Choose clean → Make it yours → Arrival → Review */
const BOOKING_PHASES: BookingScreenId[][] = [
  ["welcome", "address", "property", "service"],
  ["details", "addons"],
  ["date", "time", "access"],
  ["review", "payment"],
];

function bookingPhaseIndex(id: BookingScreenId): number {
  const idx = BOOKING_PHASES.findIndex((phase) => phase.includes(id));
  return idx >= 0 ? idx : 0;
}

export function BookingProgressBar({
  currentId,
  className,
}: {
  currentId: BookingScreenId;
  className?: string;
}) {
  const phase = bookingPhaseIndex(currentId);
  const total = BOOKING_PHASES.length;
  const step = phase + 1;

  return (
    <div className={cn("booking-progress w-full", className)}>
      <div className="mb-1.5 text-center text-[11px] font-semibold tracking-wide text-[var(--ml-book-ink-muted)]">
        Step {step} of {total}
      </div>
      <div
        className="mx-auto flex w-full max-w-[280px] items-center justify-center gap-1.5"
        role="progressbar"
        aria-valuenow={step}
        aria-valuemin={1}
        aria-valuemax={total}
        aria-label={`Booking progress, step ${step} of ${total}`}
      >
        {Array.from({ length: total }, (_, i) => (
          <span
            key={i}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-colors duration-200",
              i <= phase ? "bg-[var(--ml-book-primary,#04CED2)]" : "bg-[var(--ml-book-border-strong)]",
            )}
            aria-hidden
          />
        ))}
      </div>
    </div>
  );
}

/** @deprecated Prefer BookingProgressBar — kept for any legacy imports. */
export function BookingProgressDots({
  currentId,
  className,
}: {
  currentId: BookingScreenId;
  className?: string;
}) {
  return <BookingProgressBar currentId={currentId} className={className} />;
}

function CompactMark({ href }: { href: string }) {
  return (
    <a
      href={href}
      className="inline-flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-full"
      aria-label="MaidLinx home"
    >
      <Image
        src="/brand/maidlinx-mark.png"
        alt="MaidLinx"
        width={48}
        height={48}
        className="size-12 object-cover"
        priority
      />
    </a>
  );
}

/** Lift sticky footer above the soft keyboard (iOS Safari / Android Chrome). */
function useKeyboardInset(): number {
  const [inset, setInset] = useState(0);
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const sync = () => {
      const overlap = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      setInset(overlap > 40 ? overlap : 0);
    };
    sync();
    vv.addEventListener("resize", sync);
    vv.addEventListener("scroll", sync);
    return () => {
      vv.removeEventListener("resize", sync);
      vv.removeEventListener("scroll", sync);
    };
  }, []);
  return inset;
}

/**
 * Midnight-navy booking shell — 20px margins, 48px mark, total + CTA together.
 */
export function BookingShell({
  screenId,
  title,
  subtitle,
  children,
  hideCta = false,
  ctaLabel = "Continue",
  ctaDisabled = false,
  ctaLoading = false,
  onContinue,
  footerHint,
  className,
  locationSlot,
  backHref,
  hideDefaultTotal = false,
}: BookingFlowChromeProps) {
  const router = useRouter();
  const { state } = useBooking();
  const prev = getPreviousScreen(screenId, state);
  const phase = bookingPhaseIndex(screenId);
  const showBack = phase > 0 || Boolean(backHref);
  const keyboardInset = useKeyboardInset();

  const quoteInput = useMemo(
    () => buildQuoteInput(state, { requireAddress: true, allowPreview: true }),
    [state],
  );
  const { pricing, loading: priceLoading } = useBookingPricing({
    quoteInput,
    enabled: Boolean(quoteInput && state.serviceType && state.squareFootage),
  });

  const estimatedTotal =
    pricing && !pricing.quoteOnly
      ? formatCurrency(pricing.totalCents, pricing.currency)
      : null;

  const handleBack = () => {
    if (backHref) {
      router.push(backHref);
      return;
    }
    if (prev) {
      router.push(BOOKING_SCREEN_PATHS[prev]);
      return;
    }
    router.push(routes.home);
  };

  const showSticky = !hideCta && Boolean(onContinue);

  return (
    <div
      data-theme="ml-book"
      className={cn(
        "booking-shell flex h-dvh flex-col overflow-hidden bg-[var(--ml-book-bg,#01193D)] text-[var(--ml-book-ink,#ffffff)]",
        className,
      )}
      style={
        {
          fontFamily: "var(--ml-font-ios)",
          ["--ml-keyboard-inset" as string]: `${keyboardInset}px`,
        } as React.CSSProperties
      }
    >
      <header className="z-50 shrink-0 border-b border-[var(--ml-book-border)] bg-[var(--ml-book-bg,#01193D)]">
        <div className="relative mx-auto flex h-14 max-w-[680px] items-center px-5 pt-[env(safe-area-inset-top)]">
          <div className="z-10 flex min-w-[3rem] items-center justify-start gap-1">
            {showBack ? (
              <button
                type="button"
                onClick={handleBack}
                className="inline-flex size-10 items-center justify-center rounded-xl text-white transition-colors hover:bg-white/10"
                aria-label="Go back"
              >
                <ChevronLeft className="size-6" strokeWidth={2.25} aria-hidden />
              </button>
            ) : null}
            <CompactMark href={routes.home} />
          </div>

          <div className="pointer-events-none absolute inset-x-20 flex justify-center sm:inset-x-24">
            <BookingProgressBar currentId={screenId} />
          </div>

          <div className="z-10 ml-auto flex min-w-[3rem] items-center justify-end" />
        </div>
      </header>

      <main
        className={cn(
          "booking-slide-main mx-auto w-full max-w-[680px] flex-1 overflow-y-auto overscroll-y-contain px-5 pt-5",
          showSticky
            ? "pb-[calc(9rem+env(safe-area-inset-bottom)+var(--ml-keyboard-inset,0px))]"
            : "pb-[max(1.5rem,env(safe-area-inset-bottom))]",
        )}
      >
        <div className="booking-shell-enter mb-5">
          <h1 className="booking-step-title">{title}</h1>
          {subtitle ? <p className="booking-step-subtitle">{subtitle}</p> : null}
          {locationSlot ? <div className="mt-2.5">{locationSlot}</div> : null}
        </div>
        <div className="booking-shell-enter booking-body" style={{ animationDelay: "40ms" }}>
          {children}
        </div>
      </main>

      {showSticky ? (
        <div className="booking-sticky-footer shrink-0 border-t border-[var(--ml-book-border)] bg-[var(--ml-book-bg,#01193D)]/95 backdrop-blur-md">
          <div className="mx-auto w-full max-w-[680px] space-y-2 px-5 pt-3">
            {footerHint ??
              (!hideDefaultTotal && estimatedTotal ? (
                <div className="flex items-center justify-between gap-3 text-[16px]">
                  <span className="text-[var(--ml-book-ink-muted)]">Estimated total</span>
                  <span className="font-semibold tabular-nums text-white">
                    {priceLoading ? "Updating…" : estimatedTotal}
                  </span>
                </div>
              ) : null)}
            <Button
              type="button"
              variant="accent"
              size="lg"
              className="booking-cta-btn h-14 w-full rounded-2xl text-base font-bold shadow-none"
              disabled={ctaDisabled || ctaLoading}
              onClick={onContinue}
            >
              {ctaLoading ? "Please wait…" : ctaLabel}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

/** Alias — BookingShell is the canonical name. */
export function BookingFlowChrome(props: BookingFlowChromeProps) {
  return <BookingShell {...props} />;
}
