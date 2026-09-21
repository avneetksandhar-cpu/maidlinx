"use client";

import { BookingStepShell } from "@/components/booking-flow/BookingStepShell";
import { BookingSummary } from "@/components/booking-flow/BookingSummary";
import { useStepGate } from "@/features/booking-flow/useStepGate";
import { STEP_PATHS } from "@/lib/booking-flow/copy";
import { startsAtIso } from "@/lib/booking-flow/dates";
import { nightServiceMatch } from "@/lib/booking-flow/rank-matches";
import { useNightBooking } from "@/lib/booking-flow/provider";
import { budgetToSpendBand } from "@/lib/booking-flow/types";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function ConfirmScreen() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { state, hydrated } = useStepGate("confirm");
  const { patch } = useNightBooking();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const match =
    state.selectedMatch ??
    (state.destination && state.date
      ? nightServiceMatch({
          area: state.destination.label,
          localDate: state.date,
          partySize: state.partySize,
        })
      : null);

  useEffect(() => {
    if (!state.selectedMatch && match) patch({ selectedMatch: match });
  }, [match, patch, state.selectedMatch]);

  async function requestBooking() {
    if (!user) {
      router.push(`/auth?next=${encodeURIComponent(STEP_PATHS.confirm)}`);
      return;
    }
    setBusy(true);
    setError(null);
    const created = await fetch("/api/bookings/night", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        scopeConductAck: true,
        eventId: match?.eventId || undefined,
        eventExternalId: match?.externalId || undefined,
        occasion: match?.name || "Night out",
        atmosphere: state.vibe ?? "Nightlife",
        area: state.destination?.label || match?.area || "Miami",
        startsAt: startsAtIso(match?.localDate || state.date || "", match?.localTimeText),
        groupSize: state.partySize,
        spendBand: budgetToSpendBand(state.budget),
        specialRequests: [
          `Night context: ${match?.venueName || match?.name || "Miami"}.`,
          `Experience: ${state.experienceType ?? "open"}. Vibe: ${state.vibe ?? "open"}. Budget: ${state.budget ?? "open"}.`,
          "This is Wingman night service, not a venue table.",
        ].join(" "),
      }),
    });
    const booking = (await created.json()) as {
      requestId?: string;
      quoteId?: string;
      hostName?: string;
      hostDisplayName?: string;
      totalCents?: number;
      terms?: string;
      error?: string;
    };
    setBusy(false);
    if (!created.ok || !booking.requestId || !booking.quoteId) {
      setError(booking.error ?? "Could not create the request.");
      return;
    }
    patch({
      requestId: booking.requestId,
      quoteId: booking.quoteId,
      paymentStatus: "pending",
      confirmedOffer: {
        requestId: booking.requestId,
        quoteId: booking.quoteId,
        totalCents: booking.totalCents ?? 50_000,
        hostName: booking.hostName ?? "Andres P",
        hostDisplayName: booking.hostDisplayName ?? "Your Wingman · Andres P",
        publicVerified: false,
        photoUrl: null,
        terms: booking.terms ?? "",
      },
    });
    router.push(STEP_PATHS.matching);
  }

  if (!hydrated) return <div className="min-h-dvh bg-[#050508]" />;

  return (
    <BookingStepShell
      title="Confirm your request"
      backHref={STEP_PATHS.matches}
      showProgress={false}
      cta={authLoading || user ? "Request booking" : "Sign in to request"}
      ctaLoading={busy}
      onContinue={() => void requestBooking()}
      footerNote="You won’t be charged until your Wingman confirms."
    >
      {match ? (
        <div className="overflow-hidden rounded-[16px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={match.imageUrl} alt={match.imageAlt} className="h-40 w-full object-cover" />
        </div>
      ) : null}
      <div className="mt-6">
        <BookingSummary state={state} />
      </div>
      {error ? <p className="mt-6 text-[13px] text-[#FF8A8A]">{error}</p> : null}
    </BookingStepShell>
  );
}
