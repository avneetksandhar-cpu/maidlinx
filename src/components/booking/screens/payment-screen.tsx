"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BookingFlowChrome } from "@/components/booking/booking-flow-chrome";
import { CustomerStep } from "@/components/booking/steps/customer-step";
import { CheckoutStep } from "@/components/booking/steps/checkout-step";
import { PriceReviewStep } from "@/components/booking/steps/price-review-step";
import { useBooking } from "@/components/booking/booking-provider";
import { useBookingGuard } from "@/components/booking/use-booking-guard";
import {
  buildCreateBookingRequest,
  buildQuoteInput,
  fieldErrors,
  isQuoteOnlyBooking,
  step6CustomerSchema,
} from "@/lib/bookings/booking-helpers";
import { bookingStatusPath } from "@/lib/bookings/booking-routes";
import { useBookingPricing } from "@/hooks/use-booking-pricing";
import {
  createBooking,
  createDevTestBooking,
  fetchBooking,
  fetchDevTestBookingEnabled,
  isBookingPaymentConfirmed,
} from "@/lib/bookings/client-api";
import type { StoredBooking } from "@/lib/bookings/repository";
import { trackBookingEvent } from "@/lib/analytics/booking";
import { trackFunnelStep } from "@/lib/analytics/booking-funnel";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui";

function PaymentScreenInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { updateState, resetState } = useBooking();
  const { state, hydrated, blocked } = useBookingGuard("payment");
  const resumeId = searchParams?.get("resume") ?? state.bookingId ?? null;
  const resumeToken = searchParams?.get("token");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [devSubmitting, setDevSubmitting] = useState(false);
  const [booking, setBooking] = useState<StoredBooking | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [devTestEnabled, setDevTestEnabled] = useState(false);
  const createLock = useRef(false);
  const devLock = useRef(false);

  useEffect(() => {
    let cancelled = false;
    void fetchDevTestBookingEnabled().then((enabled) => {
      if (!cancelled) setDevTestEnabled(enabled);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!resumeId || booking) return;

    let cancelled = false;
    fetchBooking(resumeId, resumeToken)
      .then((existing) => {
        if (cancelled) return;
        if (resumeToken) setAccessToken(resumeToken);
        updateState({ bookingId: existing.id });
        if (isBookingPaymentConfirmed(existing.status)) {
          router.replace(bookingStatusPath(existing.id, resumeToken));
          return;
        }
        setBooking(existing);
      })
      .catch(() => {
        // Fresh checkout path if resume fails.
      });

    return () => {
      cancelled = true;
    };
  }, [resumeId, resumeToken, booking, updateState, router]);

  const quoteOnly = isQuoteOnlyBooking(state);
  const quoteInput = useMemo(
    () => buildQuoteInput(state, { requireAddress: true }),
    [state],
  );
  const { pricing, loading: pricingLoading, error: pricingError, isServerVerified } =
    useBookingPricing({ quoteInput, enabled: Boolean(quoteInput) });

  const persistSavedAddress = async () => {
    if (!state.saveAddressForNextTime) return;
    try {
      await fetch("/api/dashboard/addresses", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: state.saveAddressLabel?.trim() || "Home",
          formattedAddress: state.formattedAddress,
          addressLine1: state.line1,
          unit: state.line2,
          city: state.city,
          region: state.state,
          postalCode: state.postalCode,
          countryCode: state.country,
          country: state.country,
          latitude: state.latitude,
          longitude: state.longitude,
          placeId: state.googlePlaceId,
          isDefault: true,
        }),
      });
    } catch {
      // best-effort
    }
  };

  const validateBeforeCreate = (): boolean => {
    const customer = step6CustomerSchema.safeParse(state);
    if (!customer.success) {
      setErrors(fieldErrors(customer.error));
      return false;
    }
    setErrors({});

    if (!pricing || !isServerVerified) {
      setGlobalError(pricingError ?? "Unable to verify price. Please wait and try again.");
      return false;
    }
    return true;
  };

  const createAndProceed = async () => {
    if (createLock.current || submitting || booking) return;
    if (!validateBeforeCreate() || !pricing) return;

    const request = buildCreateBookingRequest(state);
    if (!request) {
      setGlobalError("Please complete all required fields.");
      return;
    }

    createLock.current = true;
    setSubmitting(true);
    setGlobalError(null);
    trackBookingEvent("checkout_started", { totalCents: pricing.totalCents });
    trackFunnelStep("pay", { totalCents: pricing.totalCents });

    try {
      // Reuse an existing pending booking id from this draft if resume already loaded it.
      if (state.bookingId && !booking) {
        try {
          const existing = await fetchBooking(state.bookingId, accessToken);
          if (existing.status === "pending_payment") {
            setBooking(existing);
            updateState({ bookingId: existing.id });
            trackBookingEvent("payment_started", { bookingId: existing.id, reused: true });
            return;
          }
        } catch {
          // Create a fresh booking below.
        }
      }

      const result = await createBooking(request, pricing.totalCents);
      setBooking(result.booking);
      setAccessToken(result.accessToken);
      updateState({ bookingId: result.booking.id });
      await persistSavedAddress();

      if (quoteOnly || pricing.quoteOnly) {
        trackBookingEvent("booking_completed", { bookingId: result.booking.id, quoteOnly: true });
        resetState();
        router.push(bookingStatusPath(result.booking.id, result.accessToken));
        return;
      }

      trackBookingEvent("payment_started", { bookingId: result.booking.id });
    } catch (error) {
      setGlobalError(error instanceof Error ? error.message : "Unable to create booking.");
    } finally {
      createLock.current = false;
      setSubmitting(false);
    }
  };

  const createDevTestAndProceed = async () => {
    if (!devTestEnabled || devLock.current || createLock.current || submitting || booking) {
      return;
    }
    if (!validateBeforeCreate() || !pricing) return;
    if (quoteOnly || pricing.quoteOnly) {
      setGlobalError("Quote-only services cannot use DEV_TEST_BOOKING.");
      return;
    }

    const request = buildCreateBookingRequest(state);
    if (!request) {
      setGlobalError("Please complete all required fields.");
      return;
    }

    devLock.current = true;
    createLock.current = true;
    setDevSubmitting(true);
    setGlobalError(null);
    trackBookingEvent("checkout_started", {
      totalCents: pricing.totalCents,
      devTest: true,
    });

    try {
      const result = await createDevTestBooking(request, pricing.totalCents);
      setBooking(result.booking);
      setAccessToken(result.accessToken);
      updateState({ bookingId: result.booking.id });
      await persistSavedAddress();
      trackBookingEvent("booking_completed", {
        bookingId: result.booking.id,
        devTest: true,
      });
      trackFunnelStep("completed", { bookingId: result.booking.id, devTest: true });
      resetState();
      router.push(bookingStatusPath(result.booking.id, result.accessToken));
    } catch (error) {
      setGlobalError(
        error instanceof Error ? error.message : "Unable to create DEV_TEST_BOOKING.",
      );
    } finally {
      devLock.current = false;
      createLock.current = false;
      setDevSubmitting(false);
    }
  };

  const handlePaymentSuccess = async () => {
    if (!booking) return;
    try {
      const confirmed = await fetchBooking(booking.id, accessToken);
      setBooking(confirmed);
      trackFunnelStep("completed", { bookingId: confirmed.id });
      resetState();
      router.push(bookingStatusPath(confirmed.id, accessToken));
    } catch (error) {
      setGlobalError(
        error instanceof Error ? error.message : "Unable to load booking confirmation.",
      );
    }
  };

  if (!hydrated || blocked) {
    return (
      <div className="flex min-h-[40dvh] items-center justify-center text-sm text-ink-muted">
        Loading…
      </div>
    );
  }

  if (booking && !quoteOnly && !pricing?.quoteOnly) {
    return (
      <BookingFlowChrome
        screenId="payment"
        title="Secure payment"
        subtitle="Pay your deposit with Stripe. No account required."
        hideCta
      >
        <CheckoutStep
          booking={booking}
          accessToken={accessToken}
          onSuccess={() => void handlePaymentSuccess()}
        />
      </BookingFlowChrome>
    );
  }

  const busy = submitting || devSubmitting;
  const bookLabel = (() => {
    if (submitting) return quoteOnly ? "Submitting…" : "Booking…";
    if (quoteOnly) return "Request quote";
    if (pricing && !pricing.quoteOnly) {
      return `Book MaidLinx — ${formatCurrency(pricing.totalCents, pricing.currency)}`;
    }
    return "Book MaidLinx";
  })();

  return (
    <BookingFlowChrome
      screenId="payment"
      title="Almost there"
      subtitle="Guest checkout is fine — no account needed."
      ctaLabel={bookLabel}
      ctaDisabled={busy || !pricing || !isServerVerified}
      ctaLoading={submitting}
      onContinue={() => void createAndProceed()}
    >
      <div className="space-y-8">
        {globalError ? (
          <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-error" role="alert">
            {globalError}
          </p>
        ) : null}

        <div className="rounded-2xl border border-[#E2E9E6] bg-[#F1F8F5] px-4 py-3.5 text-[14px] leading-relaxed text-ink">
          <p className="font-semibold text-ink">Secure checkout</p>
          <p className="mt-1 text-ink-muted">
            Card payments are processed by Stripe. MaidLinx never stores your card number.
            You pay a deposit now; any remaining balance is settled with support after the job.
          </p>
        </div>

        <PriceReviewStep
          pricing={pricing}
          loading={pricingLoading}
          error={pricingError}
          isServerVerified={isServerVerified}
        />

        {devTestEnabled && !quoteOnly ? (
          <div className="rounded-xl border border-dashed border-amber-400/80 bg-amber-50 px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-900">
              Development only
            </p>
            <p className="mt-1 text-sm text-amber-950">
              Skips the Stripe card charge and creates a paid booking for local ops testing.
              Never available when <code className="text-xs">NODE_ENV=production</code>.
            </p>
            <Button
              type="button"
              variant="secondary"
              className="mt-3 w-full rounded-xl border border-amber-500/50"
              disabled={busy || !pricing || !isServerVerified}
              onClick={() => void createDevTestAndProceed()}
            >
              {devSubmitting ? "Creating DEV TEST booking…" : "DEV TEST — NO REAL PAYMENT"}
            </Button>
          </div>
        ) : null}

        <CustomerStep
          form={state}
          onChange={(value) => updateState(value)}
          errors={errors}
          showTitle
        />
      </div>
    </BookingFlowChrome>
  );
}

export function PaymentScreen() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40dvh] items-center justify-center text-sm text-ink-muted">
          Loading checkout…
        </div>
      }
    >
      <PaymentScreenInner />
    </Suspense>
  );
}
