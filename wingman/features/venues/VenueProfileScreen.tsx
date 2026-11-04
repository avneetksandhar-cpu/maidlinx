"use client";

import { EventCard } from "@/components/cards/EventCard";
import { AppHeader } from "@/components/layout/AppHeader";
import { AppShell } from "@/components/layout/AppShell";
import { AtmospherePhoto } from "@/components/media/AtmospherePhoto";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import type { PublicEvent } from "@/lib/marketplace/queries";
import { atmosphereForVenue } from "@/lib/photos/atmosphere";
import type { PublicVenue } from "@/lib/venues/types";
import Link from "next/link";
import { useEffect, useState } from "react";

export function VenueProfileScreen({ id }: { id: string }) {
  const [venue, setVenue] = useState<PublicVenue | null>(null);
  const [events, setEvents] = useState<PublicEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [sent, setSent] = useState<string | null>(null);

  useEffect(() => {
    void fetch(`/api/venues/${encodeURIComponent(id)}`)
      .then((response) => response.json())
      .then((payload: { venue?: PublicVenue; events?: PublicEvent[]; error?: string }) => {
        if (payload.error || !payload.venue) {
          setError(payload.error ?? "Room not found.");
          return;
        }
        setVenue(payload.venue);
        setEvents(payload.events ?? []);
      })
      .catch(() => setError("Could not load this room."));
  }, [id]);

  async function inquire(kind: string) {
    if (!venue) return;
    const response = await fetch("/api/venues/inquiries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        venueId: venue.id,
        kind,
        message: note || `Inquiry for ${venue.name}`,
      }),
    });
    const payload = (await response.json()) as { error?: string };
    if (!response.ok) {
      setSent(payload.error ?? "Sign in to send this.");
      return;
    }
    setSent("Requested. Andres or the room will take it from here.");
    setNote("");
  }

  return (
    <AppShell showNav>
      <AppHeader title="" showBack backHref="/venues" />
      {error ? <p className="text-sm text-ink-muted">{error}</p> : null}
      {venue ? (
        <article>
          <AtmospherePhoto
            photo={atmosphereForVenue({
              id: venue.id,
              name: venue.name,
              category: venue.category,
              music: venue.music,
            })}
            className="mb-8 h-64 w-full"
            sizes="720px"
            priority
          />
          <p className="text-champagne">
            {venue.verified ? "Verified Venue · Wingman Partner" : venue.categoryLabel || "Miami"}
          </p>
          <h1 className="font-display mt-2 text-5xl text-ink">{venue.name}</h1>
          <p className="mt-3 text-ink-muted">
            {venue.neighborhood || venue.area}
            {venue.music ? ` · ${venue.music}` : ""}
          </p>
          {venue.description ? (
            <p className="mt-6 max-w-md text-[1.05rem] leading-relaxed text-ink">{venue.description}</p>
          ) : (
            <p className="mt-6 max-w-md text-[1.05rem] leading-relaxed text-ink-muted">
              A room on this week’s list. Ask Wingman if you want it in the night.
            </p>
          )}
          <dl className="mt-8 space-y-3 text-sm">
            {venue.atmosphere ? (
              <div className="flex justify-between gap-4">
                <dt className="text-ink-subtle">Atmosphere</dt>
                <dd>{venue.atmosphere}</dd>
              </div>
            ) : null}
            {venue.dressCode ? (
              <div className="flex justify-between gap-4">
                <dt className="text-ink-subtle">Dress</dt>
                <dd>{venue.dressCode}</dd>
              </div>
            ) : null}
            {venue.hoursText ? (
              <div className="flex justify-between gap-4">
                <dt className="text-ink-subtle">Hours</dt>
                <dd>{venue.hoursText}</dd>
              </div>
            ) : null}
          </dl>

          <div className="mt-10 space-y-3">
            <Link
              href={`/book?name=${encodeURIComponent(venue.name)}&source=venue`}
              className="block"
            >
              <Button fullWidth size="lg">
                Book a night here · $500
              </Button>
            </Link>
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              className="field"
              rows={3}
              placeholder="Date, party size, what you want from the room"
            />
            <Button variant="secondary" fullWidth onClick={() => void inquire("reserve")}>
              Ask about a table
            </Button>
            {sent ? <p className="text-sm text-champagne">{sent}</p> : null}
          </div>

          <section className="mt-14">
            <p className="text-label">Tonight and upcoming</p>
            <div className="mt-6 space-y-10">
              {events.length === 0 ? (
                <EmptyState title="No night posted yet." body="Ask Wingman to place this room in a plan." />
              ) : (
                events.slice(0, 6).map((event) => <EventCard key={event.id} event={event} />)
              )}
            </div>
          </section>

          {venue.officialUrl ? (
            <a href={venue.officialUrl} target="_blank" rel="noreferrer" className="mt-10 inline-block text-sm text-ink-subtle">
              Official site
            </a>
          ) : null}
        </article>
      ) : null}
    </AppShell>
  );
}
