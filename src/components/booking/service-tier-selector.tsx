"use client";

import { Check } from "lucide-react";
import {
  getServiceTiersForProperty,
  previewTierPrice,
  proTierUpliftCents,
  type ServiceTier,
} from "@/config/service-tiers";
import type { PropertyTypeId } from "@/config/property-types";
import type { BookingServiceId } from "@/lib/bookings/constants";
import { formatDurationLabel } from "@/lib/bookings/schedule-presets";
import { formatCurrency, cn } from "@/lib/utils";

interface ServiceTierSelectorProps {
  propertyType?: PropertyTypeId | "condo" | null;
  value?: string | null;
  serviceType?: BookingServiceId;
  bedrooms?: number;
  bathrooms?: number;
  squareFootage?: number;
  currency?: string;
  onChange: (tier: ServiceTier) => void;
  error?: string;
  className?: string;
}

export function ServiceTierSelector({
  propertyType,
  value,
  bedrooms = 2,
  bathrooms = 2,
  squareFootage = 1500,
  currency = "USD",
  onChange,
  error,
  className,
}: ServiceTierSelectorProps) {
  const tiers = getServiceTiersForProperty(propertyType);

  return (
    <fieldset className={className}>
      <legend className="sr-only">Service tier</legend>
      <div className="grid gap-2.5">
        {tiers.map((tier) => {
          const selected = value === tier.id;
          const preview = previewTierPrice({
            serviceType: tier.serviceType,
            bedrooms,
            bathrooms,
            squareFootage,
            proUpliftCents: proTierUpliftCents(tier.id, tier.serviceType),
          });

          return (
            <button
              key={tier.id}
              type="button"
              onClick={() => onChange(tier)}
              aria-pressed={selected}
              data-selected={selected}
              className={cn(
                "booking-select-card items-center gap-3 py-4 transition-transform duration-150 active:scale-[0.99]",
              )}
            >
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="text-base font-semibold text-ink">{tier.label}</span>
                  {tier.badge ? (
                    <span className="rounded-md bg-navy/90 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-white uppercase">
                      {tier.badge}
                    </span>
                  ) : null}
                </span>
                <span className="mt-0.5 block text-sm leading-snug text-ink-muted">
                  {tier.description}
                </span>
                <span className="mt-1 block text-xs text-ink-subtle">
                  {formatDurationLabel(preview.durationMinutes)}
                </span>
              </span>
              <span className="flex shrink-0 flex-col items-end gap-2">
                <span className="text-base font-semibold tabular-nums text-ink">
                  {preview.quoteOnly ? "Quote" : formatCurrency(preview.totalCents, currency)}
                </span>
                <span
                  className={cn(
                    "flex size-6 items-center justify-center rounded-full border-2 transition-colors duration-150",
                    selected
                      ? "border-accent bg-accent text-white"
                      : "border-border bg-surface text-transparent",
                  )}
                  aria-hidden
                >
                  <Check className="size-3.5" strokeWidth={3} />
                </span>
              </span>
            </button>
          );
        })}
      </div>
      {error ? <p className="mt-2 text-sm text-error">{error}</p> : null}
    </fieldset>
  );
}
