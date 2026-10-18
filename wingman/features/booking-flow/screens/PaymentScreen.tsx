"use client";

import { BookingStepShell } from "@/components/booking-flow/BookingStepShell";
import { PaymentPanel } from "@/components/booking-flow/PaymentPanel";
import { useStepGate } from "@/features/booking-flow/useStepGate";
import { useAuth } from "@/hooks/useAuth";
import { STEP_PATHS } from "@/lib/booking-flow/copy";
import { useNightBooking } from "@/lib/booking-flow/provider";
import { formatUsd } from "@/lib/format";
import { MIN_BOOKING_CENTS } from "@/lib/marketplace/constants";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export function PaymentScreen() {
  const router = useRouter();
  const params = useSearchParams();
  const { user } = useAuth();
  const { state, hydrated } = useStepGate("payment");
  const { patch } = useNightBooking();
  const [method, setMethod] = useState("apple");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(
    params.get("cancelled") === "1" ? "Payment wasn’t finished." : null,
  );
  const amount = state.confirmedOffer?.totalCents ?? MIN_BOOKING_CENTS;

  async function pay() {
    if (!user) {
      router.push(`/auth?next=${encodeURIComponent(STEP_PATHS.payment)}`);
      return;
    }
    if (!state.requestId || !state.quoteId) {
      setError("Create the request first.");
      return;
    }
    setBusy(true);
    setError(null);
    const checkout = await fetch("/api/payments/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requestId: state.requestId,
        quoteId: state.quoteId,
        returnFlow: "booking",
      }),
    });
    const payResult = (await checkout.json()) as { url?: string; error?: string; blocker?: string };
    setBusy(false);
    if (payResult.url) {
      patch({ paymentStatus: "checkout" });
      window.location.href = payResult.url;
      return;
    }
    setError(payResult.blocker ?? payResult.error ?? "Payment isn’t available right now.");
  }

  if (!hydrated) return <div className="min-h-dvh bg-[#050508]" />;

  return (
    <BookingStepShell
      title="Secure your booking"
      backHref={STEP_PATHS.wingman}
      showProgress={false}
      cta="Confirm and pay"
      ctaLoading={busy}
      onContinue={() => void pay()}
      footerNote="Charged only after your booking is confirmed."
    >
      <p className="text-[13px] text-white/45">Wingman night service</p>
      <p className="mt-2 text-[28px] font-medium tracking-[-0.03em]">{formatUsd(amount / 100)}</p>
      <div className="mt-8">
        <PaymentPanel selected={method} onSelect={setMethod} />
      </div>
      {error ? <p className="mt-6 text-[13px] text-[#FF8A8A]">{error}</p> : null}
    </BookingStepShell>
  );
}
