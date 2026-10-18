"use client";

import { EventCard } from "@/components/cards/EventCard";
import { AppHeader } from "@/components/layout/AppHeader";
import { AppShell } from "@/components/layout/AppShell";
import { CartButton } from "@/components/layout/CartButton";
import { EmptyState } from "@/components/ui/EmptyState";
import type { PublicEvent } from "@/lib/marketplace/queries";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

const WHEN_FILTERS = [
  { id: "now", label: "Happening Now" },
  { id: "today", label: "Today" },
  { id: "weekend", label: "This Weekend" },
  { id: "tonight", label: "Tonight" },
  { id: "all", label: "This week" },
] as const;

export function EventsScreen({
  initialEvents = [],
}: {
  initialEvents?: PublicEvent[];
  initialVenues?: unknown[];
}) {
  const [events, setEvents] = useState<PublicEvent[]>(initialEvents);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(initialEvents.length > 0);
  const [when, setWhen] = useState<(typeof WHEN_FILTERS)[number]["id"]>("all");
  const [query, setQuery] = useState("");
  const [music, setMusic] = useState("");
  const skipInitialFetch = useRef(initialEvents.length > 0);

  useEffect(() => {
    if (skipInitialFetch.current && when === "all" && !music) {
      skipInitialFetch.current = false;
      return;
    }
    setLoaded(false);
    const params = new URLSearchParams({ when, sort: "relevance" });
    if (music) params.set("music", music);
    void fetch(`/api/events?${params.toString()}`)
      .then((response) => response.json())
      .then((payload: { events?: PublicEvent[]; error?: string }) => {
        if (payload.error) {
          setError(payload.error);
          setLoaded(true);
          return;
        }
        setEvents(payload.events ?? []);
        setLoaded(true);
      })
      .catch(() => {
        setError("Could not load nights.");
        setLoaded(true);
      });
  }, [when, music]);

  const musicOptions = useMemo(
    () => Array.from(new Set(events.map((event) => event.musicGenre || event.category).filter(Boolean))).sort(),
    [events],
  );

  const visible = events.filter((event) => {
    const hay = `${event.name} ${event.venueName} ${event.neighborhood} ${event.musicGenre ?? ""} ${event.category}`.toLowerCase();
    return !query || hay.includes(query.toLowerCase());
  });

  return (
    <AppShell showNav>
      <AppHeader title="Search" rightAction={<CartButton />} />
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Venue, neighborhood, music"
        className="mt-1 h-12 w-full rounded-full border border-white/10 bg-white/8 px-4 text-[15px] text-white placeholder:text-white/35"
      />

      <div className="mt-4 flex gap-2 overflow-x-auto scrollbar-none">
        {WHEN_FILTERS.map((filter) => (
          <button
            key={filter.id}
            type="button"
            onClick={() => setWhen(filter.id)}
            className={cn(
              "shrink-0 rounded-full px-3.5 py-1.5 text-[13px] font-medium",
              when === filter.id ? "bg-[#FF2B8A] text-white" : "bg-white/8 text-white/70",
            )}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {musicOptions.length > 0 ? (
        <div className="mt-3 flex gap-2 overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => setMusic("")}
            className={cn(
              "shrink-0 rounded-full px-3 py-1 text-[12px]",
              music === "" ? "bg-white text-black" : "bg-white/8 text-white/65",
            )}
          >
            Music
          </button>
          {musicOptions.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setMusic(music === item ? "" : item)}
              className={cn(
                "shrink-0 rounded-full px-3 py-1 text-[12px]",
                music === item ? "bg-white text-black" : "bg-white/8 text-white/65",
              )}
            >
              {item}
            </button>
          ))}
        </div>
      ) : null}

      {error ? <p className="mt-6 text-sm text-white/50">{error}</p> : null}

      <section className="mt-6 space-y-4">
        {loaded && visible.length === 0 ? (
          <EmptyState
            title="Nothing matches."
            body="Try another search, or book a Wingman Experience."
            action={
              <Link href="/experiences" className="text-[#FF2B8A]">
                Wingman Experiences
              </Link>
            }
          />
        ) : (
          visible.map((event) => <EventCard key={event.id} event={event} />)
        )}
      </section>
    </AppShell>
  );
}
