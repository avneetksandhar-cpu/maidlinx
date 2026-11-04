import { BACKUP_ESTIMATE_NOTE, BACKUP_LISTING_LABEL } from "@/lib/marketplace/host-copy";
import type { BackupListing } from "@/lib/marketplace/backup";
import Link from "next/link";

export function BackupListingCard({
  listing,
}: {
  listing: BackupListing | null;
}) {
  if (!listing) {
    return (
      <section className="rounded-2xl border border-dashed border-border bg-surface px-4 py-4">
        <p className="text-[11px] uppercase tracking-[0.14em] text-accent">{BACKUP_LISTING_LABEL}</p>
        <p className="mt-2 text-sm leading-relaxed text-ink-muted">
          No second discovery listing to show as backup. We will not invent a venue.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-border bg-surface px-4 py-4">
      <p className="text-[11px] uppercase tracking-[0.14em] text-accent">{listing.label}</p>
      <h3 className="mt-1 text-lg text-ink">{listing.name}</h3>
      <p className="mt-1 text-sm text-ink-muted">
        {listing.venueName} · {listing.neighborhood} · {listing.localDate} · {listing.localTimeText}
      </p>
      <p className="mt-2 text-sm text-ink">{listing.estimatedSpending}</p>
      <p className="mt-1 text-xs text-ink-subtle">{listing.estimateNote}</p>
      <p className="mt-2 text-xs text-ink-subtle">
        Not a partnership. Entry and tables are not held.
      </p>
      <div className="mt-3 flex flex-col gap-2">
        <a href={listing.officialSourceUrl} target="_blank" rel="noreferrer" className="text-xs text-accent">
          View official event
        </a>
        <Link href={`/events/${listing.externalId}`} className="text-xs text-accent">
          Open listing
        </Link>
      </div>
    </section>
  );
}

export function BackupListingEmptyNote() {
  return (
    <p className="text-xs text-ink-subtle">{BACKUP_ESTIMATE_NOTE}</p>
  );
}
