import { SuccessScreen } from "@/features/booking-flow";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = { title: "You’re in — Wingman" };

export default function BookingSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-[#050508]" />}>
      <SuccessScreen />
    </Suspense>
  );
}
