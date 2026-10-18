import { ConfirmationScreen } from "@/features/booking";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Booking status — Wingman",
};

export default function BookingStatusPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center bg-background text-sm text-ink-muted">
          Confirming…
        </div>
      }
    >
      <ConfirmationScreen />
    </Suspense>
  );
}
