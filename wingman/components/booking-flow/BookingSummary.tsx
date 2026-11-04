"use client";

import { formatNightLabel } from "@/lib/booking-flow/dates";
import type { NightBookingState } from "@/lib/booking-flow/types";

export function BookingSummary({ state }: { state: NightBookingState }) {
  const match = state.selectedMatch;
  if (!match) return null;
  return (
    <div className="text-white">
      <p className="text-[16px] font-medium">{match.venueName || match.name}</p>
      <p className="mt-2 text-[13px] leading-5 text-white/55">
        {formatNightLabel(match.localDate, match.localTimeText)}
      </p>
      <p className="mt-1 text-[13px] leading-5 text-white/55">
        Party of {state.partySize} · {match.area}
      </p>
      <p className="mt-1 text-[13px] leading-5 text-white/55">{match.accessType}</p>
    </div>
  );
}
