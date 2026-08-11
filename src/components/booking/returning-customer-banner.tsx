"use client";

import { useMemo, useState } from "react";
import { Home, Building2 } from "lucide-react";
import {
  readUsualClean,
  usualCleanToBookingPatch,
  type UsualCleanProfile,
} from "@/lib/bookings/usual-clean";
import type { BookingState } from "@/lib/bookings/booking-state";
import { Button } from "@/components/ui";
import { getBookingServiceLabel } from "@/lib/bookings/constants";
import { trackBookingEvent } from "@/lib/analytics/booking";
import { trackFunnelStep } from "@/lib/analytics/booking-funnel";
import { cn } from "@/lib/utils";

interface ReturningCustomerBannerProps {
  onApply: (patch: Partial<BookingState>) => void;
  className?: string;
}

function greetingForNow(date = new Date()): string {
  const hour = date.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function placeKind(profile: UsualCleanProfile): { label: string; Icon: typeof Home } {
  const property = profile.propertyType ?? "";
  if (property === "office" || property === "retail" || property === "restaurant") {
    return { label: "Office", Icon: Building2 };
  }
  return { label: "Home", Icon: Home };
}

export function ReturningCustomerBanner({ onApply, className }: ReturningCustomerBannerProps) {
  const [profile] = useState<UsualCleanProfile | null>(() =>
    typeof window === "undefined" ? null : readUsualClean(),
  );
  const [dismissed, setDismissed] = useState(false);
  const greeting = useMemo(() => greetingForNow(), []);

  if (dismissed || !profile?.line1 || !profile.serviceType) return null;

  const serviceLabel = getBookingServiceLabel(profile.serviceType);
  const place =
    profile.formattedAddress ||
    [profile.line1, profile.city].filter(Boolean).join(", ");
  const { label: placeLabel, Icon } = placeKind(profile);

  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-surface p-4 shadow-soft sm:p-5",
        className,
      )}
    >
      <p className="text-sm font-medium text-ink-muted">{greeting}</p>
      <p className="mt-1 font-display text-xl font-semibold tracking-tight text-ink">
        Book again?
      </p>

      <div className="mt-4 flex items-start gap-3 rounded-lg bg-surface-muted/80 px-3 py-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent-muted text-accent">
          <Icon className="size-4" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-ink">{placeLabel}</p>
          <p className="mt-0.5 truncate text-sm text-ink-muted">{place}</p>
          <p className="mt-1 text-xs text-ink-subtle">
            {serviceLabel}
            {profile.extras?.length ? ` · ${profile.extras.length} extras` : ""}
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          type="button"
          variant="accent"
          size="sm"
          className="rounded-lg"
              onClick={() => {
                trackBookingEvent("service_selected", { source: "usual_clean" });
                trackFunnelStep("rebook", { source: "usual_clean" });
                onApply(usualCleanToBookingPatch(profile));
              }}
        >
          Book again
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="rounded-lg text-ink-muted"
          onClick={() => setDismissed(true)}
        >
          Not now
        </Button>
      </div>
    </div>
  );
}
