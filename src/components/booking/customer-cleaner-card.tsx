/**
 * Customer-facing cleaner trust card — truthful MaidLinx Verified messaging only.
 * Never shows private screening vendor details or raw status codes.
 */

import { buildCustomerTrustCard } from "@/lib/cleaners/trust";
import { backgroundProviderConnected } from "@/lib/cleaners/platform";

export interface CustomerCleanerCardProps {
  firstName: string | null;
  lastName: string | null;
  maidlinxVerified: boolean;
  backgroundStatus?: string;
  ratingAverage: number;
  ratingCount: number;
  completedJobs: number;
}

export function CustomerCleanerCard(props: CustomerCleanerCardProps) {
  const card = buildCustomerTrustCard({
    firstName: props.firstName,
    lastName: props.lastName,
    maidlinxVerified: props.maidlinxVerified,
    backgroundProviderConnected: backgroundProviderConnected(),
    backgroundStatus: props.backgroundStatus ?? "PENDING_PROVIDER",
    ratingAverage: props.ratingAverage,
    ratingCount: props.ratingCount,
    completedJobs: props.completedJobs,
  });

  const initials = card.displayName
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex items-start gap-3">
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-teal-muted font-display text-sm font-semibold text-navy">
        {initials || "ML"}
      </div>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-medium text-ink">{card.displayName}</p>
          {card.badgeLabel && (
            <span className="rounded-md bg-teal-muted px-2 py-0.5 text-xs font-semibold text-navy">
              {card.badgeLabel}
            </span>
          )}
        </div>
        <p className="mt-0.5 text-sm text-ink-muted">
          {card.ratingAverage.toFixed(1)} · {card.ratingCount} reviews
          {card.completedJobs > 0 ? ` · ${card.completedJobs} jobs` : ""}
        </p>
        {card.badgeExplanation && (
          <p className="mt-2 text-xs leading-relaxed text-ink-muted">{card.badgeExplanation}</p>
        )}
      </div>
    </div>
  );
}
