"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useBookingState } from "@/hooks/use-booking-state";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { BookingForm } from "@/components/booking/booking-form";
import { BOOKING_FLOW_STEPS } from "@/lib/bookings/booking-state";
import { routes } from "@/config/site";

export function BookPageContent() {
  const router = useRouter();
  const isMobile = useIsMobile();
  const { state, updateState, hydrated } = useBookingState();

  const step = state.step ?? 1;
  const stepMeta = BOOKING_FLOW_STEPS.find((s) => s.id === Math.min(step, 7));
  const showChrome = step <= 7;

  useEffect(() => {
    if (!hydrated || isMobile === null || isMobile) return;
    router.replace(`${routes.home}#book`);
  }, [hydrated, isMobile, router]);

  if (!hydrated || isMobile === null) {
    return (
      <div className="flex min-h-[50dvh] items-center justify-center text-ink-muted" aria-live="polite">
        Loading booking…
      </div>
    );
  }

  if (!isMobile) {
    return (
      <div className="flex min-h-[50dvh] items-center justify-center text-ink-muted" aria-live="polite">
        Redirecting to booking…
      </div>
    );
  }

  return (
    <div className="container-app booking-wizard-shell pt-2">
      {showChrome && stepMeta ? (
        <header className="mb-6">
          <h1 className="booking-step-title">{stepMeta.label}</h1>
          {step === 1 ? (
            <p className="booking-step-subtitle">A cleaner is closer than you think.</p>
          ) : step === 3 ? (
            <p className="booking-step-subtitle">Pick a tier — price shows on each card</p>
          ) : step === 4 ? (
            <p className="booking-step-subtitle">Add only what you need</p>
          ) : step === 5 ? (
            <p className="booking-step-subtitle">ASAP, today, tomorrow, or pick a date</p>
          ) : step === 7 ? (
            <p className="booking-step-subtitle">Guest checkout — no account required</p>
          ) : null}
        </header>
      ) : null}
      <BookingForm state={state} onChange={updateState} mode="mobile-wizard" />
      {/* Bottom tab nav intentionally omitted during booking/checkout */}
    </div>
  );
}
