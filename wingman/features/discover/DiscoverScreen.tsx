"use client";

import { EventCard } from "@/components/cards/EventCard";
import { AppHeader } from "@/components/layout/AppHeader";
import { AppShell } from "@/components/layout/AppShell";
import { CartButton } from "@/components/layout/CartButton";
import { HeartIcon } from "@/components/icons";
import { EmptyState } from "@/components/ui/EmptyState";
import type { PublicEvent } from "@/lib/marketplace/queries";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const TIME_FILTERS = [
  { id: "now", label: "Happening Now" },
  { id: "today", label: "Today" },
  { id: "weekend", label: "This Weekend" },
  { id: "tonight", label: "Tonight" },
  { id: "all", label: "This week" },
] as const;

export function DiscoverScreen({
  initialEvents = [],
}: {
  initialEvents?: PublicEvent[];
  initialBookableCount?: number;
}) {
  const [events, setEvents] = useState<PublicEvent[]>(initialEvents);
  const [when, setWhen] = useState<(typeof TIME_FILTERS)[number]["id"]>("all");
  const [music, setMusic] = useState("");
  const [loaded, setLoaded] = useState(initialEvents.length > 0);

  useEffect(() => {
    const params = new URLSearchParams({ when, sort: "relevance" });
    if (music) params.set("music", music);
    setLoaded(false);
    void fetch(`/api/events?${params.toString()}`)
      .then((response) => response.json())
      .then((payload: { events?: PublicEvent[] }) => {
        setEvents(payload.events ?? []);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, [when, music]);

  const musicOptions = useMemo(
    () => Array.from(new Set(events.map((event) => event.musicGenre || event.category).filter(Boolean))).sort(),
    [events],
  );

  return (
    <AppShell showNav>
      <AppHeader rightAction={<CartButton />} />
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">Miami</p>
          <h1 className="mt-1 font-sans text-[1.65rem] font-semibold tracking-tight text-white">Discover</h1>
        </div>
        <Link
          href="/events"
          aria-label="Saved and search"
          className="flex h-10 w-10 items-center justify-center rounded-full text-white/70"
        >
          <HeartIcon />
        </Link>
      </div>

      <div className="mt-5 flex gap-2 overflow-x-auto scrollbar-none">
        {TIME_FILTERS.map((filter) => (
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

      <section className="mt-6 space-y-4">
        {loaded && events.length === 0 ? (
          <EmptyState
            title="Nothing matches those filters."
            body="Try another time, or book a Wingman Experience."
            action={
              <Link href="/experiences" className="text-[#FF2B8A]">
                Wingman Experiences
              </Link>
            }
          />
        ) : (
          events.map((event) => <EventCard key={event.id} event={event} />)
        )}
      </section>
    </AppShell>
  );
}
