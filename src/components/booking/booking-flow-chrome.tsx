"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import { AppHeader } from "@/components/mobile/app-header";
import {
  BOOKING_SCREEN_PATHS,
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

/** Design-spec 4-phase progress: Clean → When → Review → Pay */
const BOOKING_PHASES: BookingScreenId[][] = [
  ["welcome", "address", "property", "service", "details", "addons"],
  ["date", "time"],
  ["access", "review"],
  ["payment"],
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
    <div className={cn("booking-progress", className)}>
      <div
        className="mx-auto flex w-full max-w-[680px] items-center justify-center gap-2"
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
              "h-1.5 flex-1 max-w-16 rounded-full transition-colors duration-200",
              i <= phase ? "bg-[var(--ml-dark-mint)]" : "bg-[var(--ml-dark-border)]",
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
        "booking-shell flex h-dvh flex-col overflow-hidden bg-[var(--ml-dark-bg)] text-[var(--ml-dark-ink)]",
        className,
      )}
      style={{ fontFamily: "var(--ml-font-ios)" }}
    >
      <div className="z-50 shrink-0">
        <AppHeader
          homeHref={routes.home}
          onBack={handleBack}
          logoVariant="mark"
          trailing={
            <a
              href={siteConfig.links.support}
              className="rounded-xl px-3 py-2 text-sm font-semibold text-[var(--ml-app-header-ink)] transition-colors hover:bg-black/10"
            >
              Help
            </a>
          }
        />
        <div className="border-b border-[var(--ml-dark-border)]/80 bg-[var(--ml-dark-bg)] px-4 py-2.5">
          <BookingProgressBar currentId={screenId} />
        </div>
      </div>

      {/* Single scroll region — avoid nested scroll; fit phone viewport when possible */}
      <main
        className={cn(
          "booking-slide-main mx-auto w-full max-w-[680px] flex-1 overflow-y-auto overscroll-y-contain px-4 pt-4 sm:pt-6",
          showSticky
            ? "pb-[calc(8.5rem+env(safe-area-inset-bottom))]"
            : "pb-[max(1.5rem,env(safe-area-inset-bottom))]",
        )}
      >
        <div className="booking-shell-enter mb-4 sm:mb-6">
          <h1 className="booking-step-title">{title}</h1>
          {subtitle ? <p className="booking-step-subtitle">{subtitle}</p> : null}
          {locationSlot ? <div className="mt-2.5">{locationSlot}</div> : null}
        </div>
        <div className="booking-shell-enter" style={{ animationDelay: "40ms" }}>
          {children}
        </div>
      </main>

      {showSticky ? (
        <div className="booking-sticky-footer shrink-0 border-t border-[var(--ml-dark-border)] bg-[var(--ml-dark-bg)]/95 backdrop-blur-md">
          <div className="mx-auto w-full max-w-[680px] space-y-2 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
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
              {!ctaLoading &&
              (ctaLabel.toLowerCase().includes("continue") ||
                ctaLabel.toLowerCase().includes("confirm")) ? (
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
