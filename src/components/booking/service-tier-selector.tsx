"use client";

import { BedDouble, Building2, Check, Sparkles, CalendarRange, Wrench } from "lucide-react";
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

function iconForTier(tier: ServiceTier) {
  const id = tier.id.toLowerCase();
  const slug = tier.serviceSlug?.toLowerCase() ?? "";
  if (id.includes("airbnb") || slug.includes("airbnb")) return BedDouble;
  if (id.includes("deep") || slug.includes("deep")) return Sparkles;
  if (id.includes("office") || id.includes("commercial") || slug.includes("office"))
    return Building2;
  if (id.includes("move") || slug.includes("move")) return CalendarRange;
  if (id.includes("construction") || slug.includes("construction")) return Wrench;
  return Sparkles;
}

/**
 * Choose-a-clean cards — mint radio selection, plain-language copy, real tier previews.
 */
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
      <legend className="mb-3 block text-[15px] font-medium text-[var(--ml-dark-ink)]">
        Choose a service
      </legend>
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
          const Icon = iconForTier(tier);

          return (
            <button
              key={tier.id}
              type="button"
              onClick={() => onChange(tier)}
              aria-pressed={selected}
              data-selected={selected}
              className={cn(
                "flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition-all duration-150 active:scale-[0.99]",
                selected
                  ? "border-[var(--ml-dark-mint)] bg-[var(--ml-dark-surface)] shadow-[0_0_0_1px_rgb(8_224_212_/_0.4),0_0_24px_rgb(8_224_212_/_0.18)]"
                  : "border-[var(--ml-dark-border)] bg-[var(--ml-dark-surface)] hover:border-[var(--ml-dark-border-strong)]",
              )}
            >
              <span
                className={cn(
                  "flex size-11 shrink-0 items-center justify-center rounded-xl",
                  selected
                    ? "bg-[var(--ml-dark-mint)]/15 text-[var(--ml-dark-mint)]"
                    : "bg-[var(--ml-dark-surface-2)] text-[var(--ml-dark-ink-muted)]",
                )}
                aria-hidden
              >
                <Icon className="size-5" strokeWidth={1.85} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="text-base font-semibold text-[var(--ml-dark-ink)]">
                    {tier.label}
                  </span>
                  {tier.badge ? (
                    <span className="rounded-md bg-[var(--ml-dark-mint)]/15 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-[var(--ml-dark-mint)] uppercase">
                      {tier.badge}
                    </span>
                  ) : null}
                </span>
                <span className="mt-0.5 block text-sm leading-snug text-[var(--ml-dark-ink-muted)]">
                  {tier.description}
                </span>
                <span className="mt-1 block text-xs text-[var(--ml-dark-ink-subtle)]">
                  {preview.quoteOnly
                    ? "Custom quote"
                    : `From ${formatCurrency(preview.totalCents, currency)} · ${formatDurationLabel(preview.durationMinutes)}`}
                </span>
              </span>
              <span
                className={cn(
                  "flex size-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors duration-150",
                  selected
                    ? "border-[var(--ml-dark-mint)] bg-[var(--ml-dark-mint)] text-[var(--color-accent-foreground)]"
                    : "border-[var(--ml-dark-border-strong)] bg-transparent text-transparent",
                )}
                aria-hidden
              >
                <Check className="size-3.5" strokeWidth={3} />
              </span>
            </button>
          );
        })}
      </div>
      {error ? <p className="mt-2 text-sm text-error">{error}</p> : null}
    </fieldset>
  );
}
