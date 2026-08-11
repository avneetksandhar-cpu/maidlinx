"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { SiteLogo } from "@/components/brand/site-logo";
import { Button } from "@/components/ui";
import { BookingFlowSummary } from "@/components/booking/booking-flow-summary";
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
  const pct = Math.round(((current + 1) / total) * 100);

  return (
    <div
      className={cn("booking-progress-track", className)}
      role="progressbar"
      aria-valuenow={current + 1}
      aria-valuemin={1}
      aria-valuemax={total}
      aria-label="Booking progress"
    >
      <div className="booking-progress-fill" style={{ width: `${pct}%` }} />
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

export function BookingFlowChrome({
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

  const priceHint = estimatedTotal ? (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="text-ink-muted">Estimated total</span>
      <span className="font-semibold tabular-nums text-ink">
        {priceLoading ? "Updating…" : estimatedTotal}
      </span>
    </div>
  ) : null;

  const mergedFooterHint = footerHint ?? priceHint;

  const handleBack = () => {
    if (prev) {
      router.push(BOOKING_SCREEN_PATHS[prev]);
      return;
    }
    router.push(routes.home);
  };

  return (
    <div className={cn("min-h-dvh bg-background", className)}>
      <header className="sticky top-0 z-50 border-b border-border bg-surface/95 backdrop-blur-sm">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-3 px-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleBack}
              className="inline-flex size-9 items-center justify-center rounded-lg text-ink transition-colors duration-200 hover:bg-surface-muted"
              aria-label={prev ? "Go back" : "Back to home"}
            >
              <ChevronLeft className="size-5" strokeWidth={2} aria-hidden />
            </button>
            <SiteLogo variant="mark" href={routes.home} className="shrink-0" />
          </div>
          <a
            href={siteConfig.links.support}
            className="rounded-lg px-3 py-2 text-sm font-medium text-ink-muted transition-colors duration-200 hover:text-ink"
          >
            Help
          </a>
        </div>
        <BookingProgressBar currentId={screenId} />
      </header>

      <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 pt-6 pb-28 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-12 lg:pt-10 lg:pb-16">
        <div className="mx-auto w-full max-w-xl lg:mx-0 lg:max-w-none">
          <div className="mb-8 animate-[fadeIn_0.25s_ease]">
            <h1 className="booking-step-title">{title}</h1>
            {subtitle ? <p className="booking-step-subtitle">{subtitle}</p> : null}
          </div>
          <div className="animate-[fadeIn_0.3s_ease]">{children}</div>
        </div>

        <div className="hidden lg:block">
          <div className="sticky top-20">
            <BookingFlowSummary
              footerHint={mergedFooterHint}
              estimatedTotal={estimatedTotal}
              priceLoading={priceLoading}
            />
            {!hideCta && onContinue ? (
              <Button
                type="button"
                variant="accent"
                size="lg"
                className="mt-4 h-12 w-full rounded-lg text-base font-semibold"
                disabled={ctaDisabled || ctaLoading}
                onClick={onContinue}
              >
                {ctaLoading ? "Please wait…" : ctaLabel}
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      {!hideCta && onContinue ? (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-md lg:hidden">
          <div className="mx-auto w-full max-w-lg space-y-2">
            {mergedFooterHint}
            <Button
              type="button"
              variant="accent"
              size="lg"
              className="h-12 w-full rounded-lg text-base font-semibold"
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
