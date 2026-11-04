import { TicketScreen } from "@/features/booking";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Ticket — Wingman",
};

export default function TicketPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center bg-background text-sm text-ink-muted">
          Loading ticket…
        </div>
      }
    >
      <TicketScreen />
    </Suspense>
  );
}
