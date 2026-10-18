"use client";

import { HeartIcon } from "@/components/icons";
import { formatNightLabel } from "@/lib/booking-flow/dates";
import type { VenueMatch } from "@/lib/booking-flow/types";
import { cn } from "@/lib/utils";
import { loadSavedEventIds, toggleSavedEvent } from "@/lib/venues/saved";
import { useState } from "react";

export function VenueMatchCard({
  match,
  featured = false,
  selected = false,
  onSelect,
}: {
  match: VenueMatch;
  featured?: boolean;
  selected?: boolean;
  onSelect: () => void;
}) {
  const [saved, setSaved] = useState(() => (match.eventId ? loadSavedEventIds().includes(match.eventId) : false));
  const when = formatNightLabel(match.localDate, match.localTimeText);

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "w-full overflow-hidden rounded-[16px] border text-left transition-colors duration-200",
        featured ? "border-[#C9A227]/70" : selected ? "border-[#00C2FF]/70" : "border-white/10",
      )}
    >
      <span className={cn("relative block bg-[#111114]", featured ? "aspect-[16/10]" : "h-28")}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={match.imageUrl} alt={match.imageAlt} className="h-full w-full object-cover" />
        {featured ? (
          <span className="absolute left-3 top-3 text-[11px] font-medium tracking-[0.08em] text-[#C9A227]">
            BEST MATCH
          </span>
        ) : null}
        {match.eventId ? (
          <span
            role="presentation"
            className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center text-white/80"
            onClick={(event) => {
              event.stopPropagation();
              setSaved(toggleSavedEvent(match.eventId as string).includes(match.eventId as string));
            }}
          >
            <HeartIcon className={cn("h-4 w-4", saved && "text-white")} />
          </span>
        ) : null}
      </span>
      <span className="block px-4 py-3">
        <span className="block text-[16px] font-medium text-white">{match.venueName || match.name}</span>
        <span className="mt-1 block text-[13px] leading-5 text-white/50">
          {match.area} · {when}
        </span>
        <span className="mt-1 block text-[13px] leading-5 text-white/50">
          {match.accessType}
          {match.estimatedSpend ? ` · ${match.estimatedSpend}` : ""}
        </span>
      </span>
    </button>
  );
}
