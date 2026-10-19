"use client";

import Image from "next/image";
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

const TIER_IMAGE: Record<string, string> = {
  standard: "/booking/cat-home.jpg",
  deep: "/booking/welcome-living.jpg",
  move: "/booking/cat-airbnb.jpg",
  office: "/booking/cat-office.jpg",
  airbnb: "/booking/cat-airbnb.jpg",
  commercial: "/booking/cat-commercial.jpg",
};

function imageForTier(tier: ServiceTier): string {
  const id = tier.id.toLowerCase();
  const slug = tier.serviceSlug?.toLowerCase() ?? "";
  if (id.includes("deep") || slug.includes("deep")) return TIER_IMAGE.deep ?? TIER_IMAGE.standard!;
  if (id.includes("move") || slug.includes("move")) return TIER_IMAGE.move ?? TIER_IMAGE.standard!;
  if (id.includes("office") || slug.includes("office")) return TIER_IMAGE.office ?? TIER_IMAGE.standard!;
  if (id.includes("airbnb") || slug.includes("airbnb")) return TIER_IMAGE.airbnb ?? TIER_IMAGE.standard!;
  if (id.includes("commercial") || slug.includes("commercial"))
    return TIER_IMAGE.commercial ?? TIER_IMAGE.standard!;
  return TIER_IMAGE.standard ?? "/booking/cat-home.jpg";
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
      <div className="grid gap-3">
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
                "flex w-full items-stretch gap-0 overflow-hidden rounded-2xl border text-left transition-all duration-150 active:scale-[0.99]",
                selected
                  ? "border-[var(--ml-dark-mint)] bg-[var(--ml-dark-surface)] shadow-[0_0_0_1px_rgb(8_224_212_/_0.4),0_0_24px_rgb(8_224_212_/_0.18)]"
                  : "border-[var(--ml-dark-border)] bg-[var(--ml-dark-surface)] hover:border-[var(--ml-dark-border-strong)]",
              )}
            >
              <span className="relative hidden w-24 shrink-0 sm:block">
                <Image
                  src={imageForTier(tier)}
                  alt=""
                  fill
                  sizes="96px"
                  className="object-cover"
                />
              </span>
              <span className="flex min-w-0 flex-1 items-center gap-3 p-4">
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
                    {formatDurationLabel(preview.durationMinutes)}
                  </span>
                </span>
                <span className="flex shrink-0 flex-col items-end gap-2">
                  <span className="text-base font-semibold tabular-nums text-[var(--ml-dark-ink)]">
                    {preview.quoteOnly
                      ? "Quote"
                      : `From ${formatCurrency(preview.totalCents, currency)}`}
                  </span>
                  <span
                    className={cn(
                      "flex size-6 items-center justify-center rounded-full border-2 transition-colors duration-150",
                      selected
                        ? "border-[var(--ml-dark-mint)] bg-[var(--ml-dark-mint)] text-[var(--color-accent-foreground)]"
                        : "border-[var(--ml-dark-border-strong)] bg-transparent text-transparent",
                    )}
                    aria-hidden
                  >
                    <Check className="size-3.5" strokeWidth={3} />
                  </span>
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
