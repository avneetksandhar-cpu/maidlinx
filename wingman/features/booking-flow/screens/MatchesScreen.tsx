"use client";

import { BookingStepShell } from "@/components/booking-flow/BookingStepShell";
import { VenueMatchCard } from "@/components/booking-flow/VenueMatchCard";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { useStepGate } from "@/features/booking-flow/useStepGate";
import { nightServiceMatch } from "@/lib/booking-flow/rank-matches";
import { STEP_PATHS } from "@/lib/booking-flow/copy";
import { useNightBooking } from "@/lib/booking-flow/provider";
import type { VenueMatch } from "@/lib/booking-flow/types";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function MatchesScreen() {
  const router = useRouter();
  const { state, hydrated } = useStepGate("matches");
  const { patch } = useNightBooking();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hydrated || !state.destination || !state.date) return;
    const params = new URLSearchParams({
      date: state.date,
      destination: state.destination.neighborhood || state.destination.label,
      partySize: String(state.partySize),
    });
    if (state.experienceType) params.set("experienceType", state.experienceType);
    if (state.vibe) params.set("vibe", state.vibe);
    if (state.budget) params.set("budget", state.budget);
    setLoading(true);
    void fetch(`/api/booking/matches?${params}`)
      .then((response) => (response.ok ? response.json() : { matches: [] }))
      .then((payload: { matches?: VenueMatch[] }) => {
        const matches = payload.matches ?? [];
        patch({
          matches,
          selectedMatch:
            matches.find((item) => item.id === state.selectedMatch?.id) ?? matches[0] ?? null,
        });
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, state.date, state.destination?.label, state.experienceType, state.vibe, state.partySize, state.budget]);

  if (!hydrated) return <div className="min-h-dvh bg-[#050508]" />;

  const best = state.matches[0];
  const rest = state.matches.slice(1, 3);

  return (
    <BookingStepShell
      title="Your best matches"
      step={6}
      backHref={STEP_PATHS.budget}
      cta="Continue"
      ctaDisabled={!state.selectedMatch && !state.destination}
      onContinue={() => {
        if (!state.selectedMatch && state.destination && state.date) {
          patch({
            selectedMatch: nightServiceMatch({
              area: state.destination.label,
              localDate: state.date,
              partySize: state.partySize,
            }),
          });
        }
        router.push(STEP_PATHS.confirm);
      }}
    >
      {loading ? (
        <div className="space-y-4">
          <LoadingSkeleton className="h-48 w-full rounded-[16px]" />
          <LoadingSkeleton className="h-28 w-full rounded-[16px]" />
          <LoadingSkeleton className="h-28 w-full rounded-[16px]" />
        </div>
      ) : best ? (
        <div className="space-y-4">
          <VenueMatchCard
            match={best}
            featured
            selected={state.selectedMatch?.id === best.id}
            onSelect={() => patch({ selectedMatch: best })}
          />
          {rest.map((match) => (
            <VenueMatchCard
              key={match.id}
              match={match}
              selected={state.selectedMatch?.id === match.id}
              onSelect={() => patch({ selectedMatch: match })}
            />
          ))}
        </div>
      ) : (
        <p className="text-[13px] leading-5 text-white/50">
          Nothing listed for that night yet. You can still request a Wingman for{" "}
          {state.destination?.label ?? "Miami"}.
        </p>
      )}
    </BookingStepShell>
  );
}
