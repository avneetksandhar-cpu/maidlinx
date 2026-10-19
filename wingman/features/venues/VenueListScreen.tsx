"use client";

import { VenueCard } from "@/components/cards/VenueCard";
import { AppHeader } from "@/components/layout/AppHeader";
import { AppShell } from "@/components/layout/AppShell";
import { EmptyState } from "@/components/ui/EmptyState";
import type { PublicVenue } from "@/lib/venues/types";
import { VENUE_CATEGORIES, VENUE_CATEGORY_LABEL } from "@/lib/venues/types";
import Link from "next/link";
import { useEffect, useState } from "react";

export function VenueListScreen({ initialVenues = [] }: { initialVenues?: PublicVenue[] }) {
  const [venues, setVenues] = useState<PublicVenue[]>(initialVenues);
  const [loaded, setLoaded] = useState(initialVenues.length > 0);

  useEffect(() => {
    if (initialVenues.length > 0) return;
    void fetch("/api/venues")
      .then((response) => response.json())
      .then((payload: { venues?: PublicVenue[] }) => {
        setVenues(payload.venues ?? []);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, [initialVenues.length]);

  return (
    <AppShell showNav>
      <AppHeader title="Rooms" showBack backHref="/events" />
      <h1 className="font-display text-4xl text-ink">Popular in Miami</h1>
      <p className="mt-3 max-w-sm text-[0.95rem] text-ink-muted">
        Real rooms from the week. A listing here is not a reserved table.
      </p>
      <div className="mt-8 space-y-10">
        {VENUE_CATEGORIES.map((category) => {
          const group = venues.filter((venue) => venue.category === category);
          if (group.length === 0) return null;
          return (
            <section key={category}>
              <p className="text-label">{VENUE_CATEGORY_LABEL[category]}</p>
              <div className="mt-4 flex gap-4 overflow-x-auto scrollbar-none">
                {group.map((venue) => (
                  <VenueCard key={venue.id} venue={venue} />
                ))}
              </div>
            </section>
          );
        })}
        {loaded && venues.length === 0 ? (
          <EmptyState title="The rooms are still coming in." body="Explore the week while we keep this list honest." />
        ) : null}
        {venues.some((venue) => !venue.category) ? (
          <section>
            <p className="text-label">Also on the list</p>
            <div className="mt-4 flex gap-4 overflow-x-auto scrollbar-none">
              {venues.filter((venue) => !venue.category).map((venue) => (
                <VenueCard key={venue.id} venue={venue} />
              ))}
            </div>
          </section>
        ) : null}
      </div>
      <Link href="/venues/apply" className="mt-12 inline-block text-sm text-ink-subtle">
        Clubs and restaurants — build a verified profile
      </Link>
    </AppShell>
  );
}
