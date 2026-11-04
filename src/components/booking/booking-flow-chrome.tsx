"use client";

import { useMemo } from "react";
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

/** Customer-facing 4 panels: Where → Clean → When → Review */
const BOOKING_PHASES: BookingScreenId[][] = [
  ["welcome", "address"],
  ["property", "service", "details", "addons"],
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
      <div className="mb-1.5 text-center text-[11px] font-semibold tracking-wide text-[var(--ml-book-ink-muted,#4a5568)]">
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
              i <= phase ? "bg-[var(--ml-book-primary,#04CED2)]" : "bg-[#e5e7eb]",
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

function CircularMark({ href }: { href: string }) {
  return (
    <a
      href={href}
      className="inline-flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white ring-1 ring-[var(--ml-book-border,#e2e8f0)]"
      aria-label="MaidLinx home"
    >
      <Image
        src="/brand/maidlinx-mark.png"
        alt="MaidLinx"
        width={36}
        height={36}
        className="size-9 object-cover"
        priority
      />
    </a>
  );
}

/**
 * Light 4-step booking shell — white / navy #01193D / turquoise #04CED2.
 * Sticky primary CTA, Step X of 4 progress, circular mark.
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
        "booking-shell flex h-dvh flex-col overflow-hidden bg-white text-[var(--ml-book-ink,#01193D)]",
        className,
      )}
      style={{ fontFamily: "var(--ml-font-ios)" }}
    >
      <header className="z-50 shrink-0 border-b border-[var(--ml-book-border,#e2e8f0)] bg-white">
        <div className="relative mx-auto flex h-14 max-w-[680px] items-center px-3 pt-[env(safe-area-inset-top)] sm:px-4">
          <div className="z-10 flex min-w-[2.75rem] items-center justify-start gap-1">
            {showBack ? (
              <button
                type="button"
                onClick={handleBack}
                className="inline-flex size-10 items-center justify-center rounded-xl text-[var(--ml-book-ink,#01193D)] transition-colors hover:bg-black/5"
                aria-label="Go back"
              >
                <ChevronLeft className="size-6" strokeWidth={2.25} aria-hidden />
              </button>
            ) : null}
            <CircularMark href={routes.home} />
          </div>

          <div className="pointer-events-none absolute inset-x-16 flex justify-center sm:inset-x-24">
            <BookingProgressBar currentId={screenId} />
          </div>

          <div className="z-10 ml-auto flex min-w-[2.75rem] items-center justify-end" />
        </div>
      </header>

      <main
        className={cn(
          "booking-slide-main mx-auto w-full max-w-[680px] flex-1 overflow-y-auto overscroll-y-contain px-4 pt-5 sm:pt-6",
          showSticky
            ? "pb-[calc(8.5rem+env(safe-area-inset-bottom))]"
            : "pb-[max(1.5rem,env(safe-area-inset-bottom))]",
        )}
      >
        <div className="booking-shell-enter mb-5 sm:mb-6">
          <h1 className="booking-step-title text-[var(--ml-book-ink,#01193D)]">{title}</h1>
          {subtitle ? (
            <p className="booking-step-subtitle text-[var(--ml-book-ink-muted,#4a5568)]">
              {subtitle}
            </p>
          ) : null}
          {locationSlot ? <div className="mt-2.5">{locationSlot}</div> : null}
        </div>
        <div className="booking-shell-enter" style={{ animationDelay: "40ms" }}>
          {children}
        </div>
      </main>

      {showSticky ? (
        <div className="booking-sticky-footer shrink-0 border-t border-[var(--ml-book-border,#e2e8f0)] bg-white/95 backdrop-blur-md">
          <div className="mx-auto w-full max-w-[680px] space-y-2 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            {footerHint ??
              (!hideDefaultTotal && estimatedTotal ? (
                <div className="flex items-center justify-between gap-3 text-[15px]">
                  <span className="text-[var(--ml-book-ink-muted,#4a5568)]">Estimated total</span>
                  <span className="font-semibold tabular-nums text-[var(--ml-book-ink,#01193D)]">
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
