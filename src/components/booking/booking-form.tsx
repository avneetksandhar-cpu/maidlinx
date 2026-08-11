"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AddressAutocomplete } from "@/components/booking/address-autocomplete";
import { BookingProgress } from "@/components/booking/booking-progress";
import { ConfirmPropertyStep } from "@/components/booking/confirm-property-step";
import { CustomerStep } from "@/components/booking/steps/customer-step";
import { CheckoutStep } from "@/components/booking/steps/checkout-step";
import { MatchingStep } from "@/components/booking/matching-step";
import { PriceReviewStep } from "@/components/booking/steps/price-review-step";
import { DynamicServiceQuestions } from "@/components/booking/dynamic-service-questions";
import { ExtrasSelector } from "@/components/booking/extras-selector";
import { MobileBookingFooter } from "@/components/booking/mobile-booking-footer";
import { PriceSummary } from "@/components/booking/price-summary";
import { PropertyTypeCards } from "@/components/booking/property-type-cards";
import { ReturningCustomerBanner } from "@/components/booking/returning-customer-banner";
import { ScheduleWhenSelector } from "@/components/booking/schedule-when-selector";
import { ServiceTierSelector } from "@/components/booking/service-tier-selector";
import { getServiceBySlug, isQuoteOnlyService } from "@/config/services";
import { getPropertyType, type PropertyTypeId } from "@/config/property-types";
import type { ServiceTier } from "@/config/service-tiers";
import { siteConfig } from "@/config/site";
import { resolveServiceArea } from "@/lib/service-area";
import {
  BOOKING_FLOW_STEPS,
  BOOKING_MATCHING_STEP,
  BOOKING_PAYMENT_STEP,
  type BookingState,
  type SchedulePreset,
} from "@/lib/bookings/booking-state";
import { createBooking, fetchBooking } from "@/lib/bookings/client-api";
import type { StoredBooking } from "@/lib/bookings/repository";
import type { ArrivalWindowId } from "@/lib/bookings/constants";
import { validateServiceAnswers, type ServiceAnswers } from "@/lib/services/questions";
import { getPropertyQuestions } from "@/config/property-types";
import { useBookingPricing } from "@/hooks/use-booking-pricing";
import {
  step1AddressSchema,
  step2PropertySchema,
  step3ServiceSchema,
  step4ExtrasSchema,
  step5ScheduleSchema,
  step6CustomerSchema,
  fieldErrors,
  type BookingQuoteInput,
  type CreateBookingRequest,
} from "@/lib/validations/booking-flow";
import { Button, Heading } from "@/components/ui";
import { cn, formatCurrency } from "@/lib/utils";
import { trackBookingEvent } from "@/lib/analytics/booking";
import { resolveServiceAreaCurrency } from "@/lib/bookings/market-currency";

const CONTACT_STEP = 7;
const PAYMENT_STEP = BOOKING_PAYMENT_STEP;
const MATCHING_STEP = BOOKING_MATCHING_STEP;

interface BookingFormProps {
  state: BookingState;
  onChange: (value: Partial<BookingState>) => void;
  mode: "desktop" | "mobile-wizard";
  className?: string;
  /** When true, skip address step chrome (homepage already collected it). */
  startAtProperty?: boolean;
}

function buildQuoteInput(
  state: BookingState,
  options: { requireAddress?: boolean; allowPreview?: boolean } = {},
): BookingQuoteInput | null {
  if (!state.serviceType) return null;

  const hasAddress = Boolean(state.line1?.trim() && state.city?.trim() && state.postalCode?.trim());
  if (options.requireAddress && !hasAddress) return null;
  if (!hasAddress && !options.allowPreview) return null;

  return {
    line1: state.line1?.trim() || "123 Preview St",
    line2: state.line2,
    city: state.city?.trim() || "Preview",
    state: state.state?.trim() || "CA",
    postalCode: state.postalCode?.trim() || "00000",
    country: state.country ?? "US",
    latitude: state.latitude,
    longitude: state.longitude,
    googlePlaceId: state.googlePlaceId,
    formattedAddress: state.formattedAddress,
    marketId: state.marketId,
    zoneId: state.zoneId,
    serviceType: state.serviceType,
    serviceSlug: state.serviceSlug,
    serviceAnswers: state.serviceAnswers,
    propertyType: state.propertyType,
    bedrooms: state.bedrooms ?? 0,
    bathrooms: state.bathrooms ?? 1,
    squareFootage: state.squareFootage ?? 1000,
    extras: state.extras ?? [],
    notes: state.notes,
    accessNotes: state.accessNotes,
    schedulePreset: state.schedulePreset,
  };
}

function mergeNotes(state: BookingState): string | undefined {
  const parts = [state.notes?.trim(), state.accessNotes?.trim() ? `Access: ${state.accessNotes.trim()}` : ""]
    .filter(Boolean);
  return parts.length ? parts.join("\n\n") : undefined;
}

function buildCreateBookingRequest(state: BookingState): CreateBookingRequest | null {
  const parsed = step1AddressSchema
    .merge(step2PropertySchema)
    .merge(step3ServiceSchema)
    .merge(step4ExtrasSchema)
    .merge(step5ScheduleSchema)
    .merge(step6CustomerSchema)
    .safeParse({
      ...state,
      bedrooms: state.bedrooms ?? 0,
      bathrooms: state.bathrooms ?? 1,
      squareFootage: state.squareFootage ?? 1000,
      extras: state.extras ?? [],
      serviceAnswers: state.serviceAnswers ?? {},
      serviceSlug: state.serviceSlug,
      notes: mergeNotes(state),
    });

  return parsed.success ? parsed.data : null;
}

export function BookingForm({ state, onChange, mode, className, startAtProperty }: BookingFormProps) {
  const isMobileWizard = mode === "mobile-wizard";
  const step = Math.min(Math.max(state.step ?? 1, 1), MATCHING_STEP);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [booking, setBooking] = useState<StoredBooking | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const abandonedTracked = useRef(false);

  const quoteOnly = Boolean(state.serviceType && isQuoteOnlyService(state.serviceType));
  const currency = resolveServiceAreaCurrency(state) ?? "USD";

  const updateForm = useCallback(
    (value: Partial<BookingState>) => {
      onChange(value);
    },
    [onChange],
  );

  useEffect(() => {
    if (startAtProperty && step === 1 && state.line1 && state.inServiceArea) {
      onChange({ step: 2 });
    }
  }, [startAtProperty, step, state.line1, state.inServiceArea, onChange]);

  useEffect(() => {
    const onUnload = () => {
      if (abandonedTracked.current) return;
      if (step >= PAYMENT_STEP || !state.line1) return;
      abandonedTracked.current = true;
      trackBookingEvent("booking_abandoned", { step, serviceType: state.serviceType });
    };
    window.addEventListener("pagehide", onUnload);
    return () => window.removeEventListener("pagehide", onUnload);
  }, [step, state.line1, state.serviceType]);

  const quoteInput = useMemo(
    () =>
      buildQuoteInput(state, {
        requireAddress: true,
        allowPreview: step >= 3 && step <= 6 && Boolean(state.serviceType),
      }),
    [state, step],
  );

  const pricingEnabled = Boolean(quoteInput) && Boolean(state.serviceType) && step >= 3;

  const { pricing, loading: pricingLoading, error: pricingError, isServerVerified } =
    useBookingPricing({ quoteInput, enabled: pricingEnabled });

  const syncStep = useCallback(
    (next: number) => {
      onChange({ step: Math.min(Math.max(next, 1), MATCHING_STEP) });
    },
    [onChange],
  );

  const validatePropertyQuestions = (): boolean => {
    if (!state.propertyType) {
      setErrors({ propertyType: "Select a property type." });
      return false;
    }

    const propertyQuestions = getPropertyQuestions(state.propertyType);
    const answers: ServiceAnswers = {
      ...(state.serviceAnswers ?? {}),
      ...(state.bedrooms !== undefined ? { bedrooms: state.bedrooms } : {}),
      ...(state.bathrooms !== undefined ? { bathrooms: state.bathrooms } : {}),
      ...(state.squareFootage !== undefined ? { squareFootage: state.squareFootage } : {}),
      ...(state.propertyType ? { propertyType: state.propertyType } : {}),
    };
    const propertyResult = validateServiceAnswers(propertyQuestions, answers);
    if (!propertyResult.ok) {
      setErrors(propertyResult.errors);
      return false;
    }

    const property = step2PropertySchema.safeParse({
      bedrooms: state.bedrooms ?? 0,
      bathrooms: state.bathrooms ?? 1,
      squareFootage: state.squareFootage ?? 1500,
      propertyType: state.propertyType,
      notes: state.notes,
      serviceAnswers: state.serviceAnswers,
    });
    if (!property.success) {
      setErrors(fieldErrors(property.error));
      return false;
    }

    // Move property: sync selected direction onto service type before tiers.
    if (state.propertyType === "move") {
      const raw = state.serviceAnswers?.moveDirection;
      const serviceType =
        raw === "move_in" || raw === "move_out" ? (raw as "move_in" | "move_out") : null;
      if (serviceType) {
        updateForm({
          serviceType,
          serviceSlug: serviceType === "move_in" ? "move-in" : "move-out",
        });
      }
    }
    return true;
  };

  const validateStep = (currentStep: number): boolean => {
    setErrors({});
    setGlobalError(null);

    if (currentStep === 1) {
      const parsed = step1AddressSchema.safeParse(state);
      if (!parsed.success) {
        setErrors(fieldErrors(parsed.error));
        return false;
      }
      if (!state.marketId || state.inServiceArea === false) {
        setGlobalError("This address is outside MaidLinx service markets.");
        return false;
      }
    }

    if (currentStep === 2) {
      return validatePropertyQuestions();
    }

    if (currentStep === 3) {
      const parsed = step3ServiceSchema.safeParse(state);
      if (!parsed.success) {
        setErrors(fieldErrors(parsed.error));
        return false;
      }
      if (!state.serviceTierId && !state.serviceType) {
        setErrors({ serviceType: "Select a service." });
        return false;
      }
    }

    if (currentStep === 4 && !quoteOnly) {
      const parsed = step4ExtrasSchema.safeParse(state);
      if (!parsed.success) {
        setErrors(fieldErrors(parsed.error));
        return false;
      }
    }

    if (currentStep === 5) {
      if (!state.schedulePreset) {
        setErrors({ schedulePreset: "Choose when you need cleaning." });
        return false;
      }
      const parsed = step5ScheduleSchema.safeParse(state);
      if (!parsed.success) {
        setErrors(fieldErrors(parsed.error));
        return false;
      }
      trackBookingEvent("date_selected", {
        preset: state.schedulePreset,
        date: state.date,
        window: state.arrivalWindow,
      });
    }

    if (currentStep === 6) {
      // Confirm property — address already validated; unit/access optional
      return true;
    }

    if (currentStep === CONTACT_STEP) {
      const parsed = step6CustomerSchema.safeParse(state);
      if (!parsed.success) {
        setErrors(fieldErrors(parsed.error));
        return false;
      }
      if (!pricing || !isServerVerified) {
        setGlobalError(pricingError ?? "Unable to verify price. Please wait and try again.");
        return false;
      }
      trackBookingEvent("checkout_started", { totalCents: pricing.totalCents });
    }

    return true;
  };

  const createBookingAndProceed = async () => {
    const request = buildCreateBookingRequest(state);
    if (!request) {
      setGlobalError("Please complete all required fields.");
      return;
    }
    if (!pricing || !isServerVerified) {
      setGlobalError(pricingError ?? "Unable to verify price. Please wait and try again.");
      return;
    }

    setSubmitting(true);
    setGlobalError(null);
    try {
      const result = await createBooking(request, pricing.totalCents);
      setBooking(result.booking);
      setAccessToken(result.accessToken);
      updateForm({ bookingId: result.booking.id });

      if (state.saveAddressForNextTime) {
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
      }

      if (quoteOnly || pricing.quoteOnly) {
        syncStep(MATCHING_STEP);
      } else {
        trackBookingEvent("payment_started", { bookingId: result.booking.id });
        syncStep(PAYMENT_STEP);
      }
    } catch (error) {
      setGlobalError(error instanceof Error ? error.message : "Unable to create booking.");
    } finally {
      setSubmitting(false);
    }
  };

  const nextStep = (current: number): number => {
    if (current === 3 && quoteOnly) return 5; // skip extras for quote-only
    if (current === 6) return CONTACT_STEP;
    return current + 1;
  };

  const prevStep = (current: number): number => {
    if (current === CONTACT_STEP) return 6;
    if (current === 5 && quoteOnly) return 3;
    return current - 1;
  };

  const handleContinue = async () => {
    if (step === MATCHING_STEP) return;

    if (step === CONTACT_STEP) {
      if (!validateStep(step)) return;
      await createBookingAndProceed();
      return;
    }

    if (!validateStep(step)) return;
    syncStep(nextStep(step));
  };

  const handleBack = () => {
    if (step === PAYMENT_STEP || step === MATCHING_STEP) return;
    if (step <= 1) return;
    syncStep(prevStep(step));
  };

  const handlePaymentSuccess = async () => {
    if (!booking) return;
    try {
      const confirmed = await fetchBooking(booking.id, accessToken);
      setBooking(confirmed);
      syncStep(MATCHING_STEP);
    } catch (error) {
      setGlobalError(error instanceof Error ? error.message : "Unable to load booking confirmation.");
    }
  };

  const continueLabel = useMemo(() => {
    const priceSuffix =
      pricing && !pricing.quoteOnly && pricing.totalCents > 0 && step >= 3 && step <= CONTACT_STEP
        ? ` — ${formatCurrency(pricing.totalCents, pricing.currency)}`
        : "";

    if (step === CONTACT_STEP) {
      if (submitting) return quoteOnly ? "Submitting…" : "Saving booking…";
      if (quoteOnly) return "Request quote";
      return pricing && !pricing.quoteOnly
        ? `Book cleaning — ${formatCurrency(pricing.totalCents, pricing.currency)}`
        : "Continue to payment";
    }
    if (step === 6) return `Continue${priceSuffix}`;
    if (step >= 3 && step <= 5 && priceSuffix) return `Continue${priceSuffix}`;
    return "Continue";
  }, [step, submitting, quoteOnly, pricing]);

  const handleServiceAnswers = (answers: ServiceAnswers, mapped: Record<string, unknown>) => {
    updateForm({
      serviceAnswers: answers,
      ...mapped,
    });
  };

  const handleAddressUpdate = (value: Partial<BookingState>) => {
    const area = resolveServiceArea({
      postalCode: value.postalCode ?? state.postalCode,
      city: value.city ?? state.city,
      state: value.state ?? state.state,
      country: value.country ?? state.country,
    });
    updateForm({
      ...value,
      marketId: area.marketId,
      zoneId: area.zoneId,
      inServiceArea: area.inServiceArea,
      marketName: area.marketName ?? null,
    });
  };

  const selectProperty = (propertyType: PropertyTypeId) => {
    const property = getPropertyType(propertyType);
    trackBookingEvent("property_selected", { propertyType });
    const nextAnswers: ServiceAnswers = {
      ...(state.serviceAnswers ?? {}),
      propertyType,
    };
    if (
      propertyType === "retail" ||
      propertyType === "restaurant" ||
      propertyType === "office"
    ) {
      nextAnswers.businessType = propertyType;
    }

    updateForm({
      propertyType,
      serviceAnswers: nextAnswers,
      // Prefill default service for tier step, but don't lock tier yet
      serviceType: property?.defaultServiceType,
      serviceSlug: property?.defaultServiceSlug,
      serviceTierId: null,
      bedrooms: property?.questionSet === "commercial" ? 0 : (state.bedrooms ?? 2),
      bathrooms: state.bathrooms ?? (property?.questionSet === "commercial" ? 1 : 2),
      squareFootage: state.squareFootage ?? 1500,
    });
  };

  const selectTier = (tier: ServiceTier) => {
    const service = getServiceBySlug(tier.serviceSlug);
    trackBookingEvent("service_selected", {
      tierId: tier.id,
      serviceType: tier.serviceType,
    });
    updateForm({
      serviceTierId: tier.id,
      serviceType: tier.serviceType,
      serviceSlug: service?.slug ?? tier.serviceSlug,
      serviceTile:
        tier.serviceType === "office"
          ? "office"
          : tier.serviceType === "airbnb_turnover"
            ? "airbnb"
            : tier.serviceType.startsWith("move")
              ? "move"
              : tier.serviceType === "post_construction"
                ? "construction"
                : "home",
    });
  };

  const showWizard = step <= CONTACT_STEP;
  const showPayment = step === PAYMENT_STEP && booking;
  const showMatching = step === MATCHING_STEP && booking;
  const showSidebar = !isMobileWizard && step >= 3 && step <= CONTACT_STEP && Boolean(state.serviceType);

  const mobileFooterVisible = isMobileWizard && step >= 1 && step <= CONTACT_STEP;

  const marketBanner =
    state.marketName && state.inServiceArea ? (
      <p className="rounded-xl bg-accent/5 px-4 py-2 text-sm text-ink">
        Great — MaidLinx is available in{" "}
        <span className="font-medium">{state.marketName}</span>.
      </p>
    ) : state.line1 && state.postalCode && state.inServiceArea === false ? (
      <div className="space-y-2 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-950">
        <p>We&apos;re not in your area yet.</p>
        <p className="text-amber-900/90">
          Paid booking is unavailable here.{" "}
          <a
            className="font-medium underline underline-offset-2"
            href={`${siteConfig.links.support}?subject=MaidLinx%20waitlist`}
          >
            Join the waitlist
          </a>{" "}
          and we&apos;ll notify you when we expand.
        </p>
      </div>
    ) : null;

  const stepTitle = BOOKING_FLOW_STEPS.find((s) => s.id === Math.min(step, 7))?.label;

  return (
    <div className={cn("relative", className)}>
      {showWizard ? (
        <BookingProgress
          currentStep={Math.min(step, BOOKING_FLOW_STEPS.length)}
          steps={BOOKING_FLOW_STEPS}
          variant={isMobileWizard ? "dots" : "bar"}
          className={cn(isMobileWizard ? "mb-6" : "mb-8 lg:mb-10")}
        />
      ) : null}

      {globalError ? (
        <p className="mb-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-error">{globalError}</p>
      ) : null}

      <div
        className={cn(
          showSidebar ? "grid gap-10 lg:grid-cols-[minmax(0,1fr)_340px]" : "max-w-2xl",
        )}
      >
        <div
          className={cn(
            isMobileWizard
              ? "space-y-6 pb-28"
              : "rounded-2xl bg-surface p-6 shadow-card sm:p-8 lg:p-10",
          )}
        >
          {showWizard && step === 1 ? (
            <div className="space-y-6">
              <div>
                <Heading as="h2" className="text-2xl tracking-tight sm:text-3xl">
                  Where should we clean?
                </Heading>
                <p className="mt-2 text-sm text-ink-muted">
                  Enter your address — we&apos;ll check your market instantly.
                </p>
              </div>
              <ReturningCustomerBanner
                onApply={(patch) => {
                  const area = resolveServiceArea({
                    postalCode: patch.postalCode,
                    city: patch.city,
                    state: patch.state,
                    country: patch.country,
                  });
                  updateForm({
                    ...patch,
                    marketId: area.marketId,
                    zoneId: area.zoneId,
                    inServiceArea: area.inServiceArea,
                    marketName: area.marketName ?? null,
                  });
                }}
              />
              <AddressAutocomplete
                value={state}
                onChange={handleAddressUpdate}
                errors={errors}
                placeholder="Where do you need cleaning?"
              />
              {marketBanner}
            </div>
          ) : null}

          {showWizard && step === 2 ? (
            <div className="space-y-6">
              <div>
                <Heading as="h2" className="text-2xl tracking-tight sm:text-3xl">
                  What kind of place is it?
                </Heading>
                <p className="mt-2 text-sm text-ink-muted">
                  This helps us ask the right questions and price accurately.
                </p>
              </div>
              <PropertyTypeCards
                value={state.propertyType === "condo" ? "apartment" : state.propertyType}
                onChange={selectProperty}
                error={errors.propertyType}
              />
              {state.propertyType ? (
                <DynamicServiceQuestions
                  serviceType={state.serviceType}
                  serviceSlug={state.serviceSlug}
                  answers={{
                    ...(state.serviceAnswers ?? {}),
                    ...(state.bedrooms !== undefined ? { bedrooms: state.bedrooms } : {}),
                    ...(state.bathrooms !== undefined ? { bathrooms: state.bathrooms } : {}),
                    squareFootage: String(
                      state.squareFootage ?? state.serviceAnswers?.squareFootage ?? 1500,
                    ),
                    propertyType: state.propertyType,
                  }}
                  onChange={handleServiceAnswers}
                  errors={errors}
                  questionsOverride={getPropertyQuestions(state.propertyType)}
                />
              ) : null}
            </div>
          ) : null}

          {showWizard && step === 3 ? (
            <div className="space-y-6">
              <div>
                <Heading as="h2" className="text-2xl tracking-tight sm:text-3xl">
                  Choose your clean
                </Heading>
                <p className="mt-2 text-sm text-ink-muted">
                  Prices update instantly. Final total is verified before payment.
                </p>
              </div>
              <ServiceTierSelector
                propertyType={state.propertyType}
                value={state.serviceTierId}
                bedrooms={state.bedrooms}
                bathrooms={state.bathrooms}
                squareFootage={state.squareFootage}
                currency={currency}
                onChange={selectTier}
                error={errors.serviceType}
              />
            </div>
          ) : null}

          {showWizard && step === 4 ? (
            quoteOnly ? null : (
              <div className="space-y-6">
                <div>
                  <Heading as="h2" className="text-2xl tracking-tight sm:text-3xl">
                    Add extras
                  </Heading>
                  <p className="mt-2 text-sm text-ink-muted">
                    Tap to add — price updates instantly.
                  </p>
                </div>
                <ExtrasSelector
                  hideLegend
                  value={state.extras ?? []}
                  onChange={(extras) => {
                    const added = extras.find((id) => !(state.extras ?? []).includes(id));
                    if (added) trackBookingEvent("addon_selected", { addon: added });
                    updateForm({ extras });
                  }}
                />
              </div>
            )
          ) : null}

          {showWizard && step === 5 ? (
            <div className="space-y-2">
              <Heading as="h2" className="text-2xl tracking-tight sm:text-3xl">
                When do you need us?
              </Heading>
              <ScheduleWhenSelector
                schedulePreset={state.schedulePreset}
                date={state.date}
                arrivalWindow={state.arrivalWindow}
                onPresetChange={(preset: SchedulePreset, resolved) => {
                  updateForm({
                    schedulePreset: preset,
                    date: resolved.date,
                    arrivalWindow: resolved.arrivalWindow,
                  });
                }}
                onDateChange={(date) => updateForm({ date, schedulePreset: "date" })}
                onWindowChange={(arrivalWindow: ArrivalWindowId) =>
                  updateForm({ arrivalWindow })
                }
                errors={errors}
              />
            </div>
          ) : null}

          {showWizard && step === 6 ? (
            <ConfirmPropertyStep state={state} onChange={updateForm} errors={errors} />
          ) : null}

          {showWizard && step === CONTACT_STEP ? (
            <div className="space-y-8">
              <div>
                <Heading as="h2" className="text-2xl tracking-tight sm:text-3xl">
                  Checkout
                </Heading>
                <p className="mt-2 text-sm text-ink-muted">
                  Guest checkout — no account required to pay.
                </p>
              </div>
              <PriceReviewStep
                pricing={pricing}
                loading={pricingLoading}
                error={pricingError}
                isServerVerified={isServerVerified}
              />
              <CustomerStep
                form={state}
                onChange={(value) => updateForm(value)}
                errors={errors}
                showTitle
              />
            </div>
          ) : null}

          {showPayment ? (
            <CheckoutStep
              booking={booking}
              accessToken={accessToken}
              onSuccess={handlePaymentSuccess}
            />
          ) : null}

          {showMatching ? (
            <MatchingStep
              booking={booking}
              accessToken={accessToken}
              bookingState={state}
            />
          ) : null}

          {!isMobileWizard && showWizard ? (
            <div className="mt-8 flex justify-between border-t border-border/80 pt-8">
              <Button
                type="button"
                variant="secondary"
                onClick={handleBack}
                disabled={step <= 1}
              >
                Back
              </Button>
              <Button
                type="button"
                variant="accent"
                size="lg"
                className="rounded-xl px-8 font-semibold"
                disabled={
                  submitting ||
                  (step === CONTACT_STEP && (!pricing || !isServerVerified))
                }
                onClick={() => void handleContinue()}
              >
                {continueLabel}
              </Button>
            </div>
          ) : null}
        </div>

        {showSidebar ? (
          <PriceSummary
            pricing={pricing}
            loading={pricingLoading}
            isServerVerified={isServerVerified}
            onContinue={() => void handleContinue()}
            continueLabel={continueLabel}
            continueDisabled={
              submitting ||
              (step === CONTACT_STEP && (!pricing || !isServerVerified))
            }
            showDeposit={step === CONTACT_STEP}
          />
        ) : null}
      </div>

      {mobileFooterVisible ? (
        <MobileBookingFooter
          label={continueLabel}
          onPrimary={() => void handleContinue()}
          onBack={handleBack}
          showBack={step > 1}
          disabled={
            submitting ||
            (step === CONTACT_STEP && (!pricing || !isServerVerified))
          }
        />
      ) : null}

      {/* sr-only step label for a11y when progress dots omit text */}
      {stepTitle ? <span className="sr-only">Step: {stepTitle}</span> : null}
    </div>
  );
}
