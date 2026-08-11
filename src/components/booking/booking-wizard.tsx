"use client";

import { useCallback, useMemo, useState } from "react";
import { PriceSummary } from "@/components/booking/price-summary";
import { StepIndicator } from "@/components/booking/step-indicator";
import { AddressStep } from "@/components/booking/steps/address-step";
import { PropertyStep } from "@/components/booking/steps/property-step";
import { ServiceStep } from "@/components/booking/steps/service-step";
import { ExtrasStep } from "@/components/booking/steps/extras-step";
import { ScheduleStep } from "@/components/booking/steps/schedule-step";
import { PriceReviewStep } from "@/components/booking/steps/price-review-step";
import { CustomerStep } from "@/components/booking/steps/customer-step";
import { CheckoutStep } from "@/components/booking/steps/checkout-step";
import { ConfirmationStep } from "@/components/booking/steps/confirmation-step";
import { createBooking, fetchBooking } from "@/lib/bookings/client-api";
import { BOOKING_STEP_COUNT } from "@/lib/bookings/constants";
import type { StoredBooking } from "@/lib/bookings/repository";
import { useBookingPricing } from "@/hooks/use-booking-pricing";
import {
  step1AddressSchema,
  step2PropertySchema,
  step3ServiceSchema,
  step4ExtrasSchema,
  step5ScheduleSchema,
  step6CustomerSchema,
  fieldErrors,
  type BookingFormState,
  type CreateBookingRequest,
  type BookingQuoteInput,
} from "@/lib/validations/booking-flow";
import {
  Button,
  Card,
  CardContent,
  Container,
  Eyebrow,
  Heading,
} from "@/components/ui";

const CHECKOUT_STEP = 8;
const CONFIRMATION_STEP = 9;

export function BookingWizard() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<BookingFormState>({ country: "US", extras: [] });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [booking, setBooking] = useState<StoredBooking | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const updateForm = useCallback((value: Partial<BookingFormState>) => {
    setForm((prev) => ({ ...prev, ...value }));
  }, []);

  const quoteInput = useMemo((): BookingQuoteInput | null => {
    if (!form.line1 || !form.city || !form.serviceType) return null;
    return {
      line1: form.line1,
      line2: form.line2,
      city: form.city,
      state: form.state ?? "",
      postalCode: form.postalCode ?? "",
      country: form.country ?? "US",
      latitude: form.latitude,
      longitude: form.longitude,
      googlePlaceId: form.googlePlaceId,
      formattedAddress: form.formattedAddress,
      serviceType: form.serviceType,
      bedrooms: form.bedrooms ?? 0,
      bathrooms: form.bathrooms ?? 1,
      squareFootage: form.squareFootage ?? 1000,
      extras: form.extras ?? [],
      notes: form.notes,
    };
  }, [form]);

  const pricingEnabled = step >= 3 && Boolean(quoteInput);
  const { pricing, loading: pricingLoading, error: pricingError, isServerVerified } =
    useBookingPricing({ quoteInput, enabled: pricingEnabled });

  const goNext = useCallback(async () => {
    setGlobalError(null);
    setErrors({});

    if (step === 1) {
      const parsed = step1AddressSchema.safeParse(form);
      if (!parsed.success) {
        setErrors(fieldErrors(parsed.error));
        return;
      }
      updateForm(parsed.data);
    }

    if (step === 2) {
      const parsed = step2PropertySchema.safeParse(form);
      if (!parsed.success) {
        setErrors(fieldErrors(parsed.error));
        return;
      }
      updateForm(parsed.data);
    }

    if (step === 3) {
      const parsed = step3ServiceSchema.safeParse(form);
      if (!parsed.success) {
        setErrors(fieldErrors(parsed.error));
        return;
      }
      updateForm(parsed.data);
    }

    if (step === 4) {
      const parsed = step4ExtrasSchema.safeParse(form);
      if (!parsed.success) {
        setErrors(fieldErrors(parsed.error));
        return;
      }
      updateForm(parsed.data);
    }

    if (step === 5) {
      const parsed = step5ScheduleSchema.safeParse(form);
      if (!parsed.success) {
        setErrors(fieldErrors(parsed.error));
        return;
      }
      updateForm(parsed.data);
    }

    if (step === 6) {
      if (pricingLoading) {
        setGlobalError("Please wait while we verify your price.");
        return;
      }
      if (!pricing || !isServerVerified) {
        setGlobalError(pricingError ?? "Unable to verify price. Try again.");
        return;
      }
    }

    if (step === 7) {
      const parsed = step6CustomerSchema.safeParse(form);
      if (!parsed.success) {
        setErrors(fieldErrors(parsed.error));
        return;
      }

      const merged = { ...form, ...parsed.data } as CreateBookingRequest;
      const fullParsed = step1AddressSchema
        .merge(step2PropertySchema)
        .merge(step3ServiceSchema)
        .merge(step4ExtrasSchema)
        .merge(step5ScheduleSchema)
        .merge(step6CustomerSchema)
        .safeParse(merged);

      if (!fullParsed.success) {
        setErrors(fieldErrors(fullParsed.error));
        return;
      }

      if (!pricing || !isServerVerified) {
        setGlobalError("Price verification expired. Go back and refresh your quote.");
        return;
      }

      setSubmitting(true);
      try {
        const result = await createBooking(fullParsed.data, pricing.totalCents);
        setBooking(result.booking);
        setAccessToken(result.accessToken);
        setStep(CHECKOUT_STEP);
      } catch (error) {
        setGlobalError(error instanceof Error ? error.message : "Unable to create booking.");
      } finally {
        setSubmitting(false);
      }
      return;
    }

    setStep((current) => Math.min(current + 1, BOOKING_STEP_COUNT));
  }, [form, step, pricing, pricingLoading, pricingError, isServerVerified, updateForm]);

  const goBack = () => {
    if (step <= 1 || step >= CHECKOUT_STEP) return;
    setStep((current) => current - 1);
  };

  const continueLabel = useMemo(() => {
    if (step === 7) return submitting ? "Creating booking…" : "Continue to checkout";
    if (step === 6) return pricingLoading ? "Verifying price…" : "Continue to your details";
    return "Continue";
  }, [step, submitting, pricingLoading]);

  const showSidebar = step >= 3 && step <= 6;
  const showFooter = step < CHECKOUT_STEP;

  return (
    <Container className="py-10 lg:py-14">
      <div className="mb-8 space-y-4">
        <Eyebrow>Book a clean</Eyebrow>
        <Heading as="h1">Schedule your service</Heading>
        {step < CONFIRMATION_STEP ? <StepIndicator currentStep={step} /> : null}
      </div>

      <div
        className={
          showSidebar
            ? "grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]"
            : "mx-auto max-w-2xl"
        }
      >
        <Card>
          <CardContent className="space-y-6 pt-6">
            {globalError ? (
              <p className="rounded-lg border border-error/20 bg-red-50 px-4 py-3 text-sm text-error">
                {globalError}
              </p>
            ) : null}

            {step === 1 ? (
              <AddressStep form={form} onChange={updateForm} errors={errors} />
            ) : null}

            {step === 2 ? (
              <PropertyStep form={form} onChange={updateForm} errors={errors} />
            ) : null}

            {step === 3 ? (
              <ServiceStep form={form} onChange={updateForm} errors={errors} />
            ) : null}

            {step === 4 ? <ExtrasStep form={form} onChange={updateForm} /> : null}

            {step === 5 ? (
              <ScheduleStep form={form} onChange={updateForm} errors={errors} />
            ) : null}

            {step === 6 ? (
              <PriceReviewStep
                pricing={pricing}
                loading={pricingLoading}
                error={pricingError}
                isServerVerified={isServerVerified}
              />
            ) : null}

            {step === 7 ? (
              <CustomerStep form={form} onChange={updateForm} errors={errors} />
            ) : null}

            {step === CHECKOUT_STEP && booking ? (
              <CheckoutStep
                booking={booking}
                accessToken={accessToken}
                onSuccess={async () => {
                  const confirmed = await fetchBooking(booking.id, accessToken);
                  setBooking(confirmed);
                  setStep(CONFIRMATION_STEP);
                }}
              />
            ) : null}

            {step === CONFIRMATION_STEP && booking ? (
              <ConfirmationStep booking={booking} accessToken={accessToken} />
            ) : null}

            {showFooter ? (
              <div className="flex flex-col-reverse gap-3 border-t border-border pt-6 sm:flex-row sm:justify-between">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={goBack}
                  disabled={step === 1 || submitting}
                >
                  Back
                </Button>
                <Button
                  type="button"
                  onClick={goNext}
                  disabled={submitting || (step === 6 && pricingLoading)}
                >
                  {continueLabel}
                </Button>
              </div>
            ) : null}
          </CardContent>
        </Card>

        {showSidebar ? (
          <PriceSummary
            pricing={pricing}
            loading={pricingLoading}
            isServerVerified={isServerVerified}
          />
        ) : null}
      </div>
    </Container>
  );
}
