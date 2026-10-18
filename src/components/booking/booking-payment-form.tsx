"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import {
  Elements,
  ExpressCheckoutElement,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import type { StripeExpressCheckoutElementConfirmEvent } from "@stripe/stripe-js";
import { getStripeBrowser, hasStripeBrowserEnv } from "@/lib/stripe/client";
import {
  confirmBookingPaymentSync,
  getStoredBookingAccessToken,
  pollBookingUntilConfirmed,
  startBookingCheckout,
} from "@/lib/bookings/client-api";
import { LEGAL_CONSENT_POLICY_VERSION } from "@/lib/legal/consent";
import { routes } from "@/config/site";
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

function LegalConsentCheckbox({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[#E2E9E6] bg-white px-3.5 py-3 text-sm leading-snug text-ink">
      <input
        type="checkbox"
        className="mt-0.5 h-4 w-4 shrink-0 accent-teal-700"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        required
        aria-required="true"
      />
      <span>
        I agree to the{" "}
        <Link className="underline underline-offset-2" href={routes.legal.terms} target="_blank">
          Terms of Service
        </Link>
        ,{" "}
        <Link className="underline underline-offset-2" href={routes.legal.privacy} target="_blank">
          Privacy Policy
        </Link>
        ,{" "}
        <Link
          className="underline underline-offset-2"
          href={routes.legal.cancellation}
          target="_blank"
        >
          Cancellation
        </Link>
        ,{" "}
        <Link className="underline underline-offset-2" href={routes.legal.refund} target="_blank">
          Refund
        </Link>
        , and{" "}
        <Link className="underline underline-offset-2" href={routes.legal.damage} target="_blank">
          Damage Claims
        </Link>{" "}
        policies.
      </span>
    </label>
  );
}

function PaymentForm({
  bookingId,
  accessToken,
  checkout,
  legalConsent,
  onSuccess,
}: {
  bookingId: string;
  accessToken?: string | null;
  checkout: CheckoutDetails;
  legalConsent: boolean;
  onSuccess: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expressVisible, setExpressVisible] = useState(false);
  const submitLock = useRef(false);

  async function finalizeSuccessfulPayment(paymentIntentId: string) {
    const token = accessToken ?? getStoredBookingAccessToken(bookingId);
    try {
      await confirmBookingPaymentSync(bookingId, token, paymentIntentId);
    } catch {
      // Fall through to poll — webhook may still confirm.
    }
    await pollBookingUntilConfirmed(bookingId, token, { maxAttempts: 20, intervalMs: 750 });
    onSuccess();
  }

  async function confirmWithElements() {
    if (!stripe || !elements || submitLock.current) return;
    if (!legalConsent) {
      setError("Please accept the Terms and Privacy Policy before paying.");
      return;
    }

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
        // Customer dismissed wallet sheet / cancelled — keep form usable.
        if (
          submitError.code === "canceled" ||
          /cancel/i.test(submitError.message ?? "")
        ) {
          setError(null);
          return;
        }
        setError(submitError.message ?? "Payment failed.");
        return;
      }

      await finalizeSuccessfulPayment(paymentIntent?.id ?? checkout.paymentIntentId);
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

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    await confirmWithElements();
  }

  async function handleExpressConfirm(event: StripeExpressCheckoutElementConfirmEvent) {
    if (!legalConsent) {
      setError("Please accept the Terms and Privacy Policy before paying.");
      event.paymentFailed({ reason: "fail" });
      return;
    }
    try {
      await confirmWithElements();
    } catch {
      event.paymentFailed({ reason: "fail" });
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

      {/* Wallets (Apple Pay / Google Pay / Link) — same PaymentIntent lifecycle as card. */}
      <div className={expressVisible ? "space-y-3" : "hidden"}>
        <ExpressCheckoutElement
          options={{
            paymentMethods: {
              applePay: "always",
              googlePay: "always",
              link: "auto",
              paypal: "never",
              amazonPay: "never",
              klarna: "never",
            },
            buttonHeight: 48,
          }}
          onReady={({ availablePaymentMethods }) => {
            const anyWallet = Boolean(
              availablePaymentMethods &&
                Object.values(availablePaymentMethods).some(Boolean),
            );
            setExpressVisible(anyWallet);
          }}
          onConfirm={(event) => {
            void handleExpressConfirm(event);
          }}
          onCancel={() => {
            setError(null);
          }}
        />
        <div className="flex items-center gap-3 text-xs uppercase tracking-wide text-ink-subtle">
          <span className="h-px flex-1 bg-border" />
          Or pay with card
          <span className="h-px flex-1 bg-border" />
        </div>
      </div>

      <PaymentElement
        options={{
          wallets: {
            applePay: "auto",
            googlePay: "auto",
          },
          layout: "tabs",
        }}
      />

      {error ? <p className="text-sm text-error">{error}</p> : null}

      <Button type="submit" disabled={!stripe || submitting || !legalConsent} className="w-full">
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
  const [legalConsent, setLegalConsent] = useState(false);
  const [checkout, setCheckout] = useState<CheckoutDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stripePromise] = useState(() => getStripeBrowser());
  const startLock = useRef(false);

  async function beginCheckout() {
    if (!legalConsent || startLock.current || checkout) return;
    startLock.current = true;
    setLoading(true);
    setError(null);

    try {
      const result = await startBookingCheckout(bookingId, accessToken, {
        legalConsentAccepted: true,
        legalConsentPolicyVersion: LEGAL_CONSENT_POLICY_VERSION,
      });
      setCheckout({
        clientSecret: result.clientSecret,
        paymentIntentId: result.paymentIntentId,
        depositCents: result.depositCents,
        totalCents: result.totalCents,
        depositPercent: result.depositPercent,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to start checkout.");
      startLock.current = false;
    } finally {
      setLoading(false);
    }
  }

  if (!checkout) {
    return (
      <div className="space-y-4">
        <Text muted className="text-sm">
          Total: {formatCurrency(totalCents)}. Accept the policies below to continue to secure
          checkout (Apple Pay, Google Pay, Link, or card).
        </Text>

        <LegalConsentCheckbox
          checked={legalConsent}
          onChange={setLegalConsent}
          disabled={loading}
        />

        {error ? (
          <p className="rounded-lg border border-error/20 bg-red-50 px-4 py-3 text-sm text-error">
            {error}
          </p>
        ) : null}

        <Button
          type="button"
          disabled={!legalConsent || loading}
          className="w-full"
          onClick={() => void beginCheckout()}
        >
          {loading ? "Preparing secure checkout…" : "Continue to payment"}
        </Button>
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
    <div className="space-y-4">
      <LegalConsentCheckbox checked={legalConsent} onChange={setLegalConsent} disabled />

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
          legalConsent={legalConsent}
          onSuccess={onSuccess}
        />
      </Elements>
    </div>
  );
}
