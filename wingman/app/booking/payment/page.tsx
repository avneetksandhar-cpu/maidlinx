import { PaymentScreen } from "@/features/booking-flow";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = { title: "Payment — Wingman" };

export default function BookingPaymentPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-[#050508]" />}>
      <PaymentScreen />
    </Suspense>
  );
}
