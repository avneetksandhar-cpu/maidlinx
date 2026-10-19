"use client";

import { searchMiamiPlaces } from "@/lib/booking-flow/locations";
import type { BookingDestination } from "@/lib/booking-flow/types";
import { cn } from "@/lib/utils";
import { useMemo, useState } from "react";

export function LocationSearch({
  value,
  extraLabels,
  onChange,
  onUseCurrent,
  locating,
}: {
  value: BookingDestination | null;
  extraLabels: string[];
  onChange: (destination: BookingDestination) => void;
  onUseCurrent: () => void;
  locating: boolean;
}) {
  const [query, setQuery] = useState(value?.label ?? "");
  const [open, setOpen] = useState(false);
  const suggestions = useMemo(() => searchMiamiPlaces(query, extraLabels), [query, extraLabels]);

  return (
    <div>
      <label className="block">
        <span className="sr-only">Destination</span>
        <input
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Miami Beach"
          className="h-12 w-full rounded-[16px] border border-white/10 bg-white/[0.04] px-4 text-[16px] text-white outline-none placeholder:text-white/30 focus:border-[#00C2FF]/70"
        />
      </label>
      {open && suggestions.length > 0 ? (
        <ul className="mt-2 overflow-hidden rounded-[16px] border border-white/10">
          {suggestions.map((place) => (
            <li key={place.label}>
              <button
                type="button"
                className={cn(
                  "flex min-h-11 w-full items-center px-4 text-left text-[16px] text-white/80",
                  value?.label === place.label && "text-white",
                )}
                onClick={() => {
                  setQuery(place.label);
                  setOpen(false);
                  onChange(place);
                }}
              >
                {place.label}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <button
        type="button"
        onClick={onUseCurrent}
        className="mt-3 min-h-11 text-[13px] text-white/55"
      >
        {locating ? "Finding you…" : "Use current location"}
      </button>
    </div>
  );
}
