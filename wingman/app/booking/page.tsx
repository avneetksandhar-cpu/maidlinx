import { BookingFlow } from "@/features/booking/components/BookingFlow";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Booking — Wingman",
};

function BookingFallback() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background text-sm text-ink-muted">
      Loading request…
    </div>
  );
}

export default function BookingPage() {
  return (
    <Suspense fallback={<BookingFallback />}>
      <BookingFlow />
    </Suspense>
  );
}
