import { AtmospherePhoto } from "@/components/media/AtmospherePhoto";
import { atmosphereForVenue } from "@/lib/photos/atmosphere";
import type { PublicVenue } from "@/lib/venues/types";
import Link from "next/link";

export function VenueCard({ venue }: { venue: PublicVenue }) {
  return (
    <Link href={`/venues/${venue.slug || venue.id}`} className="block min-w-[16.5rem] max-w-[18.5rem] shrink-0">
      <AtmospherePhoto
        photo={atmosphereForVenue({
          id: venue.id,
          name: venue.name,
          category: venue.category,
          music: venue.music,
        })}
        className="h-52 w-full"
        sizes="300px"
        overlay
      />
      <div className="pt-3">
        <p className="text-[0.75rem] text-champagne">
          {venue.verified ? "Verified Venue" : venue.partner ? "Wingman Partner" : venue.categoryLabel ?? "Miami"}
        </p>
        <h3 className="font-display mt-1 text-[1.65rem] leading-tight text-ink">{venue.name}</h3>
        <p className="mt-1 text-[0.8rem] text-ink-subtle">
          {venue.neighborhood || venue.area}
          {venue.tonightCount > 0
            ? ` · ${venue.tonightCount} tonight`
            : venue.upcomingCount > 0
              ? ` · ${venue.upcomingCount} this week`
              : ""}
        </p>
      </div>
    </Link>
  );
}
