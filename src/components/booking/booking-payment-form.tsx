"use client";

import { useEffect, useRef, useState } from "react";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { getStripeBrowser, hasStripeBrowserEnv } from "@/lib/stripe/client";
import {
  confirmBookingPaymentSync,
  getStoredBookingAccessToken,
  pollBookingUntilConfirmed,
  startBookingCheckout,
} from "@/lib/bookings/client-api";
import { Button, Text } from "@/components/ui";
import { formatCurrency } from "@/lib/utils";

interface BookingPaymentFormProps {
  bookingId: string;
  accessToken?: string | null;
  totalCents: number;
  onSuccess: () => void;
}

interface CheckoutDetails {
  clientSecret: string;
  paymentIntentId: string;
  depositCents: number;
  totalCents: number;
  depositPercent: number;
}

function PaymentForm({
  bookingId,
  accessToken,
  checkout,
  onSuccess,
}: {
  bookingId: string;
  accessToken?: string | null;
  checkout: CheckoutDetails;
  onSuccess: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submitLock = useRef(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!stripe || !elements || submitLock.current) return;

    submitLock.current = true;
    setSubmitting(true);
    setError(null);

    const token = accessToken ?? getStoredBookingAccessToken(bookingId);
    const tokenQuery = token ? `?token=${encodeURIComponent(token)}` : "";

    try {
      const { error: submitError, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/bookings/${bookingId}${tokenQuery}`,
        },
        redirect: "if_required",
      });

      if (submitError) {
        setError(submitError.message ?? "Payment failed.");
        return;
      }

      // Server-side sync: confirms booking from Stripe PI status (works without webhook).
      try {
        await confirmBookingPaymentSync(
          bookingId,
          token,
          paymentIntent?.id ?? checkout.paymentIntentId,
        );
      } catch {
        // Fall through to poll — webhook may still confirm.
      }

      await pollBookingUntilConfirmed(bookingId, token, { maxAttempts: 20, intervalMs: 750 });
      onSuccess();
    } catch (pollError) {
      setError(
        pollError instanceof Error
          ? pollError.message
          : "Payment succeeded but confirmation is still processing.",
      );
    } finally {
      submitLock.current = false;
      setSubmitting(false);
    }
  }

  const balanceCents = checkout.totalCents - checkout.depositCents;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="rounded-md border border-border bg-surface p-4 text-sm">
        <div className="flex justify-between">
          <span className="text-ink-muted">Deposit due today ({checkout.depositPercent}%)</span>
          <span className="font-semibold text-ink">{formatCurrency(checkout.depositCents)}</span>
        </div>
        {balanceCents > 0 ? (
          <div className="mt-2 flex justify-between">
            <span className="text-ink-muted">Balance due after service</span>
            <span>{formatCurrency(balanceCents)}</span>
          </div>
        ) : null}
        <div className="mt-2 flex justify-between border-t border-border pt-2">
          <span className="text-ink-muted">Booking total</span>
          <span>{formatCurrency(checkout.totalCents)}</span>
        </div>
      </div>

      <PaymentElement />

      {error ? <p className="text-sm text-error">{error}</p> : null}

      <Button type="submit" disabled={!stripe || submitting} className="w-full">
        {submitting ? "Processing…" : `Pay deposit ${formatCurrency(checkout.depositCents)}`}
      </Button>
    </form>
  );
}

export function BookingPaymentForm({
  bookingId,
  accessToken,
  totalCents,
  onSuccess,
}: BookingPaymentFormProps) {
  const [checkout, setCheckout] = useState<CheckoutDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stripePromise] = useState(() => getStripeBrowser());
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    let cancelled = false;

    startBookingCheckout(bookingId, accessToken)
      .then((result) => {
        if (!cancelled) {
          setCheckout({
            clientSecret: result.clientSecret,
            paymentIntentId: result.paymentIntentId,
            depositCents: result.depositCents,
            totalCents: result.totalCents,
            depositPercent: result.depositPercent,
          });
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unable to start checkout.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [bookingId, accessToken]);

  if (loading) {
    return <Text muted>Preparing secure checkout…</Text>;
  }

  if (error || !checkout) {
    return (
      <div className="space-y-3">
        <p className="rounded-lg border border-error/20 bg-red-50 px-4 py-3 text-sm text-error">
          {error ?? "Payment is unavailable."}
        </p>
        <Text muted className="text-sm">
          Total: {formatCurrency(totalCents)}. Please try again in a moment.
        </Text>
      </div>
    );
  }

  if (!hasStripeBrowserEnv()) {
    if (process.env.NODE_ENV === "development") {
      console.error(
        "[Stripe] NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY missing — card payments disabled.",
      );
    }
    return (
      <div className="space-y-3">
        <Text muted className="text-sm">
          Deposit due: {formatCurrency(checkout.depositCents)} of{" "}
          {formatCurrency(checkout.totalCents)}.
        </Text>
        <p className="rounded-lg border border-border bg-surface px-4 py-3 text-sm text-ink-muted">
          Card payments are temporarily unavailable. Please try again shortly.
        </p>
      </div>
    );
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret: checkout.clientSecret,
        appearance: { theme: "stripe", variables: { colorPrimary: "#0d9488" } },
      }}
    >
      <PaymentForm
        bookingId={bookingId}
        accessToken={accessToken}
        checkout={checkout}
        onSuccess={onSuccess}
      />
    </Elements>
  );
}
