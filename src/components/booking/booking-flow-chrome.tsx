"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { SiteLogo } from "@/components/brand/site-logo";
import { Button } from "@/components/ui";
import {
  BOOKING_SCREENS,
  BOOKING_SCREEN_PATHS,
  getBookingScreenIndex,
  getPreviousScreen,
  type BookingScreenId,
} from "@/lib/bookings/booking-routes";
import { useBooking } from "@/components/booking/booking-provider";
import { buildQuoteInput } from "@/lib/bookings/booking-helpers";
import { useBookingPricing } from "@/hooks/use-booking-pricing";
import { cn, formatCurrency } from "@/lib/utils";
import { routes, siteConfig } from "@/config/site";

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
}

export function BookingProgressBar({
  currentId,
  className,
}: {
  currentId: BookingScreenId;
  className?: string;
}) {
  const current = getBookingScreenIndex(currentId);
  const total = BOOKING_SCREENS.length;
  const step = current + 1;
  const pct = Math.round((step / total) * 100);

  return (
    <div className={cn("booking-progress", className)}>
      <div
        className="booking-progress-track mx-auto h-1 w-full max-w-[680px] overflow-hidden rounded-full bg-[var(--ml-dark-border)]"
        role="progressbar"
        aria-valuenow={step}
        aria-valuemin={1}
        aria-valuemax={total}
        aria-label={`Booking progress, step ${step} of ${total}`}
      >
        <div
          className="booking-progress-fill h-full rounded-full bg-[var(--ml-dark-mint)] transition-[width] duration-220 ease-out"
          style={{ width: `${pct}%` }}
        />
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

/**
 * Premium dark iOS booking shell — matches design-spec screens 2–6.
 * Sticky mint Continue, progress bar, safe-area footer.
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
}: BookingFlowChromeProps) {
  const router = useRouter();
  const { state } = useBooking();
  const prev = getPreviousScreen(screenId, state);

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
    if (prev) {
      router.push(BOOKING_SCREEN_PATHS[prev]);
      return;
    }
    router.push(routes.home);
  };

  const showSticky = !hideCta && Boolean(onContinue);

  return (
    <div
      data-theme="ml-dark"
      className={cn(
        "booking-shell min-h-dvh overflow-x-clip bg-[var(--ml-dark-bg)] text-[var(--ml-dark-ink)]",
        className,
      )}
    >
      <header className="sticky top-0 z-50 border-b border-[var(--ml-dark-border)]/80 bg-[var(--ml-dark-bg)]/92 backdrop-blur-md">
        <div className="mx-auto flex h-14 w-full max-w-[680px] items-center justify-between gap-3 px-4 pt-[env(safe-area-inset-top)]">
          <div className="flex min-w-0 items-center gap-1.5">
            <button
              type="button"
              onClick={handleBack}
              className="inline-flex size-10 items-center justify-center rounded-xl text-[var(--ml-dark-ink)] transition-colors duration-200 hover:bg-[var(--ml-dark-surface)] md:size-9"
              aria-label={prev ? "Go back" : "Back to home"}
            >
              <ChevronLeft className="size-5" strokeWidth={2.25} aria-hidden />
            </button>
            <SiteLogo
              variant="mark"
              tone="brand"
              href={routes.home}
              className="shrink-0"
            />
          </div>
          <a
            href={siteConfig.links.support}
            className="rounded-xl px-3 py-2 text-sm font-medium text-[var(--ml-dark-ink-muted)] transition-colors duration-200 hover:bg-[var(--ml-dark-surface)] hover:text-[var(--ml-dark-ink)]"
          >
            Help
          </a>
        </div>
        <div className="px-4 pb-3">
          <BookingProgressBar currentId={screenId} />
        </div>
      </header>

      <main
        className={cn(
          "mx-auto w-full max-w-[680px] px-4 pt-6 md:pt-8",
          showSticky
            ? "pb-[calc(9rem+env(safe-area-inset-bottom))]"
            : "pb-16",
        )}
      >
        <div className="booking-shell-enter mb-6 md:mb-8">
          <h1 className="booking-step-title">{title}</h1>
          {subtitle ? <p className="booking-step-subtitle">{subtitle}</p> : null}
          {locationSlot ? <div className="mt-3">{locationSlot}</div> : null}
        </div>
        <div className="booking-shell-enter" style={{ animationDelay: "40ms" }}>
          {children}
        </div>
      </main>

      {showSticky ? (
        <div className="booking-sticky-footer fixed inset-x-0 bottom-0 z-40 border-t border-[var(--ml-dark-border)] bg-[var(--ml-dark-bg)]/95 backdrop-blur-md">
          <div className="mx-auto w-full max-w-[680px] space-y-2.5 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            {footerHint ??
              (estimatedTotal ? (
                <div className="flex items-center justify-between gap-3 text-[15px]">
                  <span className="text-[var(--ml-dark-ink-muted)]">Estimated total</span>
                  <span className="font-semibold tabular-nums text-[var(--ml-dark-ink)]">
                    {priceLoading ? "Updating…" : estimatedTotal}
                  </span>
                </div>
              ) : null)}
            <Button
              type="button"
              variant="accent"
              size="lg"
              className="booking-cta-btn h-14 w-full rounded-2xl text-base font-semibold shadow-[0_0_28px_rgb(8_224_212_/_0.22)]"
              disabled={ctaDisabled || ctaLoading}
              onClick={onContinue}
            >
              {ctaLoading ? "Please wait…" : ctaLabel}
              {!ctaLoading && ctaLabel.toLowerCase().includes("continue") ? (
                <span aria-hidden>→</span>
              ) : null}
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
