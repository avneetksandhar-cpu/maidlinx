"use client";

import { EventCard } from "@/components/cards/EventCard";
import { VenueCard } from "@/components/cards/VenueCard";
import { AppShell } from "@/components/layout/AppShell";
import { AtmospherePhoto } from "@/components/media/AtmospherePhoto";
import { EmptyState } from "@/components/ui/EmptyState";
import { WingmanWordmark } from "@/components/brand/WingmanLogo";
import { HERO_PHOTO } from "@/lib/photos/atmosphere";
import type { PublicEvent } from "@/lib/marketplace/queries";
import { bookNightHref } from "@/lib/marketplace/book-href";
import { pickFeaturedEvents } from "@/lib/marketplace/featured";
import { customerBookingStatus } from "@/lib/marketplace/status-copy";
import { getLatestConfirmed, getOpenBooking, type StoredBooking } from "@/features/booking/storage";
import { useAuth } from "@/hooks/useAuth";
import { fadeUpShort } from "@/lib/animations";
import type { PublicVenue } from "@/lib/venues/types";
import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useState } from "react";

const fadeUp = fadeUpShort;

function firstNameFrom(userName: string | null | undefined, email: string | null | undefined) {
  const source = userName?.trim() || email?.split("@")[0] || "";
  if (!source) return "";
  const token = source.split(/[\s._+]+/)[0] ?? source;
  return token.charAt(0).toUpperCase() + token.slice(1);
}

export function HomeScreen({
  initialEvents = [],
  initialVenues = [],
}: {
  initialEvents?: PublicEvent[];
  initialVenues?: PublicVenue[];
}) {
  const { user } = useAuth();
  const [events, setEvents] = useState<PublicEvent[]>(initialEvents);
  const [venues, setVenues] = useState<PublicVenue[]>(initialVenues);
  const [confirmed, setConfirmed] = useState<StoredBooking | undefined>();
  const [open, setOpen] = useState<StoredBooking | undefined>();
  const [liveStatus, setLiveStatus] = useState<{ id: string; status: string; title: string } | null>(null);

  useEffect(() => {
    setConfirmed(getLatestConfirmed());
    setOpen(getOpenBooking());
    if (initialEvents.length === 0) {
      void fetch("/api/events?when=all")
        .then((response) => response.json())
        .then((payload: { events?: PublicEvent[] }) => setEvents(payload.events ?? []))
        .catch(() => setEvents([]));
    }
    if (initialVenues.length === 0) {
      void fetch("/api/venues")
        .then((response) => response.json())
        .then((payload: { venues?: PublicVenue[] }) => setVenues(payload.venues ?? []))
        .catch(() => setVenues([]));
    }
    void fetch("/api/requests")
      .then((response) => (response.ok ? response.json() : { requests: [] }))
      .then((payload: { requests?: Array<{ id: string; status: string; event_name?: string; occasion?: string }> }) => {
        const row = payload.requests?.[0];
        if (row) {
          setLiveStatus({
            id: row.id,
            status: row.status,
            title:
              row.event_name?.trim() ||
              (row.occasion && row.occasion !== "night_out" ? row.occasion.replace(/_/g, " ") : "Your evening"),
          });
        }
      })
      .catch(() => undefined);
  }, [initialEvents.length, initialVenues.length]);

  const greeting = firstNameFrom(user?.displayName, user?.email);
  const { featured, label: featuredLabel } = pickFeaturedEvents(events);

  return (
    <AppShell showNav noPadding>
      <header className="relative z-20 flex items-center justify-between px-5 pt-3 pb-2">
        <WingmanWordmark logoSize={22} />
        <p className="text-[0.85rem] text-ink-muted">Miami</p>
        <Link
          href="/profile"
          aria-label="Account"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-ivory/10 text-[0.75rem] text-ivory"
        >
          {(greeting || "W").slice(0, 1)}
        </Link>
      </header>

      <section className="relative isolate -mt-[3.25rem] h-[78svh] overflow-hidden xl:h-[580px]">
        <div className="absolute inset-0">
          <AtmospherePhoto
            photo={HERO_PHOTO}
            className="h-full w-full"
            imageClassName="brightness-[1.18] contrast-[1.08] saturate-[1.05]"
            sizes="(min-width: 1280px) 1120px, 100vw"
            priority
            overlay={false}
          />
        </div>
        <div
          aria-hidden
          className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,9,15,0.42)_0%,rgba(7,9,15,0.08)_32%,rgba(7,9,15,0.28)_58%,#07090f_100%)]"
        />
        <motion.div
          initial="hidden"
          animate="visible"
          className="absolute inset-x-0 bottom-0 z-10 px-6 pb-10 xl:max-w-2xl xl:px-10"
        >
          {greeting ? (
            <motion.p custom={0} variants={fadeUp} className="text-[0.95rem] text-ink-muted">
              {greeting}.
            </motion.p>
          ) : null}
          <motion.h1
            custom={0.06}
            variants={fadeUp}
            className="mt-3 font-display text-[3.15rem] leading-[1.02] text-ink drop-shadow-[0_12px_40px_rgba(0,0,0,0.55)]"
          >
            Tonight is handled.
          </motion.h1>
          <motion.p custom={0.12} variants={fadeUp} className="mt-4 max-w-[20rem] text-[1rem] leading-relaxed text-ink-muted">
            The best of Miami, through people who know it.
          </motion.p>
          <motion.div custom={0.18} variants={fadeUp} className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href={bookNightHref({ go: Boolean(user), source: "home" })}
              className="gold-btn inline-flex h-12 items-center justify-center px-6 text-[0.95rem]"
            >
              Book tonight · $500
            </Link>
            <Link
              href="/plan"
              className="inline-flex h-12 items-center justify-center bg-navy/35 px-6 text-[0.95rem] text-ink backdrop-blur-sm"
            >
              Plan my night
            </Link>
          </motion.div>
        </motion.div>
      </section>

      <div className="bg-background px-6 pb-16 xl:px-10">
        {liveStatus || confirmed || open ? (
          <section className="pt-12">
            <p className="text-label">Your night</p>
            {liveStatus ? (
              <Link href={`/requests/${liveStatus.id}`} className="mt-3 block">
                <h2 className="font-display text-3xl text-ink">{liveStatus.title}</h2>
                <p className="mt-2 text-champagne">{customerBookingStatus(liveStatus.status)}</p>
              </Link>
            ) : confirmed ? (
              <Link href={`/ticket?ref=${confirmed.ref}`} className="mt-3 block">
                <h2 className="font-display text-3xl text-ink">{confirmed.title}</h2>
                <p className="mt-2 text-champagne">Confirmed</p>
              </Link>
            ) : open ? (
              <Link href={`/booking?ref=${open.ref}`} className="mt-3 block">
                <h2 className="font-display text-3xl text-ink">{open.title}</h2>
                <p className="mt-2 text-champagne">Being arranged</p>
              </Link>
            ) : null}
          </section>
        ) : null}

        <section className="pt-14">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-label">{featuredLabel}</p>
              <h2 className="font-display mt-2 text-3xl text-ink">Worth knowing about</h2>
            </div>
            <Link href="/events" className="text-[0.9rem] text-ink-muted underline-offset-4 hover:text-ink hover:underline">
              The week
            </Link>
          </div>
          <div className="mt-8 space-y-10 xl:grid xl:grid-cols-2 xl:gap-x-10 xl:gap-y-12 xl:space-y-0">
            {featured.length === 0 ? (
              <EmptyState
                title="Tonight’s shortlist is being curated."
                body="Look at the week, or ask Andres to arrange it."
                action={
                  <Link href={bookNightHref({ source: "home" })} className="text-champagne">
                    Book tonight · $500
                  </Link>
                }
              />
            ) : (
              featured.map((event) => <EventCard key={event.id} event={event} />)
            )}
          </div>
        </section>

        <section className="pt-16">
          <p className="text-label">Popular in Miami</p>
          <h2 className="font-display mt-2 text-3xl text-ink">Rooms people ask for</h2>
          <div className="mt-8 flex gap-4 overflow-x-auto pb-2 scrollbar-none">
            {venues.length === 0 ? (
              <EmptyState title="The rooms are still coming in." body="Explore the week while we keep the list honest." />
            ) : (
              venues.slice(0, 8).map((venue) => <VenueCard key={venue.id} venue={venue} />)
            )}
          </div>
          <Link href="/venues" className="mt-6 inline-block text-[0.9rem] text-ink-muted underline-offset-4 hover:text-ink hover:underline">
            All rooms
          </Link>
        </section>
      </div>
    </AppShell>
  );
}
