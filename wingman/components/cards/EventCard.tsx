"use client";

import { EventListingPhoto } from "@/components/media/AtmospherePhoto";
import type { PublicEvent } from "@/lib/marketplace/queries";
import Link from "next/link";

export function EventCard({
  event,
}: {
  event: PublicEvent;
  compact?: boolean;
}) {
  const vibe = event.musicGenre || event.atmosphere || event.category;

  return (
    <article className="overflow-hidden rounded-2xl bg-white/[0.04]">
      <Link href={`/events/${event.externalId}`} className="relative block h-64">
        <EventListingPhoto event={event} className="h-full w-full" />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/55 to-transparent px-3.5 pb-3 pt-12">
          <p className="text-[15px] font-semibold text-white">{event.venueName}</p>
          <p className="mt-0.5 text-[12px] text-white/75">
            {vibe}
            {event.neighborhood || event.area ? ` · ${event.neighborhood || event.area}` : ""}
          </p>
          <p className="mt-0.5 text-[12px] text-white/60">{event.localTimeText}</p>
        </div>
      </Link>
    </article>
  );
}
