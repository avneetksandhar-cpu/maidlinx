"use client";

import { AppHeader } from "@/components/layout/AppHeader";
import { AppShell } from "@/components/layout/AppShell";
import { CartButton } from "@/components/layout/CartButton";
import { EventListingPhoto } from "@/components/media/AtmospherePhoto";
import { formatListingDate } from "@/lib/events/format";
import type { PublicEvent, PublicOffer } from "@/lib/marketplace/queries";
import Link from "next/link";
import { useEffect, useState } from "react";

export function EventDetailScreen({ id }: { id: string }) {
  const [event, setEvent] = useState<PublicEvent | null>(null);
  const [offers, setOffers] = useState<PublicOffer[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetch(`/api/events/${id}`)
      .then((response) => response.json())
      .then((payload: { event?: PublicEvent; offers?: PublicOffer[]; error?: string }) => {
        if (payload.error || !payload.event) {
          setError(payload.error ?? "That night is not on the list.");
          return;
        }
        setEvent(payload.event);
        setOffers(payload.offers ?? []);
      })
      .catch(() => setError("Could not load this night."));
  }, [id]);

  const vipCount = offers.filter((offer) => offer.serviceType === "vip_table" || Boolean(offer.tablePackageName)).length;

  return (
    <AppShell showNav noPadding>
      <div className="px-5">
        <AppHeader title="" showBack backHref="/home" rightAction={<CartButton />} />
      </div>
      {error ? <p className="px-5 text-sm text-ink-muted">{error}</p> : null}
      {event ? (
        <article className="flex flex-1 flex-col">
          <EventListingPhoto event={event} className="h-72 w-full" priority />
          <div className="flex flex-1 flex-col px-5 pb-6 pt-5">
            <p className="text-[13px] font-medium uppercase tracking-[0.14em] text-white/45">
              {event.neighborhood || event.area || "Miami"}
            </p>
            <h1 className="mt-1 text-[1.7rem] font-semibold leading-tight text-white">{event.venueName}</h1>
            <p className="mt-1 text-[15px] text-white/70">{event.name}</p>
            <p className="mt-3 text-[14px] text-white/60">
              {formatListingDate(event.localDate)} · {event.localTimeText}
            </p>

            <dl className="mt-6 space-y-3 text-[14px]">
              <Row label="Music" value={event.musicGenre || event.atmosphere || event.category} />
              <Row label="Dress" value={event.dressCode || "Ask at the door"} />
              <Row label="Age" value={event.ageRequirement} />
            </dl>

            <p className="mt-6 text-[13px] leading-relaxed text-white/50">
              {event.bookable && vipCount > 0
                ? "A VIP table is bookable for this night, or book a Wingman Experience."
                : "Book a Wingman Experience. Extra drinks, bottles, and upgrades are separate."}
            </p>

            <div className="mt-auto pt-8">
              <Link
                href={`/events/${encodeURIComponent(id)}/choose`}
                className="inline-flex h-14 w-full items-center justify-center rounded-full bg-[#FF2B8A] text-[0.95rem] font-semibold text-white hover:bg-[#ff4a9c]"
              >
                Book Now
              </Link>
            </div>
          </div>
        </article>
      ) : null}
    </AppShell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-6">
      <dt className="text-white/45">{label}</dt>
      <dd className="text-right text-white">{value}</dd>
    </div>
  );
}
