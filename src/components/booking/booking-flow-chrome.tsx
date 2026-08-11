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
      <div className="mx-auto flex w-full max-w-[680px] items-center justify-between gap-3 px-4 pb-2 pt-1">
        <p className="text-[13px] font-medium tracking-wide text-ink-muted">
          Step {step} of {total}
        </p>
        <p className="text-[12px] text-ink-subtle">{BOOKING_SCREENS[current]?.shortLabel}</p>
      </div>
      <div
        className="booking-progress-track"
        role="progressbar"
        aria-valuenow={step}
        aria-valuemin={1}
        aria-valuemax={total}
        aria-label={`Booking progress, step ${step} of ${total}`}
      >
        <div className="booking-progress-fill" style={{ width: `${pct}%` }} />
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
 * One booking shell for every funnel step.
 * Desktop + mobile: logo/Help, Step X of Y + bar, centered ~680px content,
 * sticky bottom Estimated total + Continue.
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
      className={cn(
        "booking-shell min-h-dvh overflow-x-clip bg-[#FAFCFB]",
        className,
      )}
    >
      <header className="sticky top-0 z-50 border-b border-[#E2E9E6] bg-[#FAFCFB]/95 backdrop-blur-md">
        <div className="mx-auto flex h-14 w-full max-w-[680px] items-center justify-between gap-3 px-4">
          <div className="flex min-w-0 items-center gap-1.5">
            <button
              type="button"
              onClick={handleBack}
              className="inline-flex size-10 items-center justify-center rounded-xl text-ink transition-colors duration-200 hover:bg-[#F1F8F5] md:size-9"
              aria-label={prev ? "Go back" : "Back to home"}
            >
              <ChevronLeft className="size-5" strokeWidth={2.25} aria-hidden />
            </button>
            <SiteLogo variant="mark" href={routes.home} className="shrink-0" />
          </div>
          <a
            href={siteConfig.links.support}
            className="rounded-xl px-3 py-2 text-sm font-medium text-ink-muted transition-colors duration-200 hover:bg-[#F1F8F5] hover:text-ink"
          >
            Help
          </a>
        </div>
        <BookingProgressBar currentId={screenId} />
      </header>

      <main
        className={cn(
          "mx-auto w-full max-w-[680px] px-4 pt-7 md:pt-10",
          /* Sticky bar ≈ 7.25rem; keep ≥1.5rem clearance above CTA on small phones */
          showSticky
            ? "pb-[calc(9rem+env(safe-area-inset-bottom))]"
            : "pb-16",
        )}
      >
        <div className="booking-shell-enter mb-7 md:mb-9">
          <h1 className="booking-step-title">{title}</h1>
          {subtitle ? <p className="booking-step-subtitle">{subtitle}</p> : null}
        </div>
        <div className="booking-shell-enter" style={{ animationDelay: "40ms" }}>
          {children}
        </div>
      </main>

      {showSticky ? (
        <div className="booking-sticky-footer fixed inset-x-0 bottom-0 z-40 border-t border-[#E2E9E6] bg-white/95 backdrop-blur-md">
          <div className="mx-auto w-full max-w-[680px] space-y-2.5 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            {footerHint ??
              (estimatedTotal ? (
                <div className="flex items-center justify-between gap-3 text-[15px]">
                  <span className="text-ink-muted">Estimated total</span>
                  <span className="font-semibold tabular-nums text-ink">
                    {priceLoading ? "Updating…" : estimatedTotal}
                  </span>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-3 text-[15px]">
                  <span className="text-ink-muted">Estimated total</span>
                  <span className="font-medium tabular-nums text-ink-subtle">—</span>
                </div>
              ))}
            <Button
              type="button"
              variant="accent"
              size="lg"
              className="booking-cta-btn h-14 w-full rounded-xl text-base font-semibold"
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
