import type { BookingServiceId } from "@/lib/bookings/constants";
import type { PropertyTypeId } from "@/config/property-types";
import { getPropertyType } from "@/config/property-types";
import {
  BATHROOM_CENTS,
  BEDROOM_CENTS,
  PLATFORM_FEE_PERCENT,
  SERVICE_BASE_CENTS,
  estimateDurationMinutes,
  squareFootageAdjustment,
} from "@/lib/pricing/config";
import { isQuoteOnlyService } from "@/config/services";

/**
 * UberX-style service product cards shown after property selection.
 * Prices are client preview only — server still authorizes via assertPriceMatch.
 */

export interface ServiceTier {
  id: string;
  label: string;
  description: string;
  serviceType: BookingServiceId;
  serviceSlug: string;
  /** Optional highlight for the recommended tier. */
  badge?: string;
}

export function getServiceTiersForProperty(
  propertyTypeId?: PropertyTypeId | "condo" | null,
): ServiceTier[] {
  if (propertyTypeId === "condo") propertyTypeId = "apartment";
  const property = getPropertyType(propertyTypeId);

  if (propertyTypeId === "airbnb") {
    return [
      {
        id: "airbnb",
        label: "Turnover",
        description: "Guest-ready between stays",
        serviceType: "airbnb_turnover",
        serviceSlug: "airbnb",
        badge: "Popular",
      },
      {
        id: "deep",
        label: "Deep",
        description: "Detailed reset for longer gaps",
        serviceType: "deep",
        serviceSlug: "deep",
      },
      {
        id: "standard",
        label: "Standard",
        description: "Light refresh between guests",
        serviceType: "standard",
        serviceSlug: "residential",
      },
      {
        id: "pro",
        label: "Pro",
        description: "Specialist Pros for premium listings",
        serviceType: "deep",
        serviceSlug: "deep",
        badge: "Top Pros",
      },
    ];
  }

  if (
    propertyTypeId === "office" ||
    propertyTypeId === "retail" ||
    propertyTypeId === "restaurant" ||
    propertyTypeId === "commercial"
  ) {
    return [
      {
        id: "office",
        label: "Standard",
        description: "Routine commercial clean",
        serviceType: "office",
        serviceSlug: "office",
        badge: "Popular",
      },
      {
        id: "deep",
        label: "Deep",
        description: "Detailed commercial detail",
        serviceType: "deep",
        serviceSlug: "deep",
      },
      {
        id: "pro",
        label: "Pro",
        description: "Specialist team for sensitive spaces",
        serviceType: "office",
        serviceSlug: "office",
        badge: "Top Pros",
      },
      {
        id: "event",
        label: "Event",
        description: "Pre- or post-event reset",
        serviceType: "event_venue",
        serviceSlug: "event-venue",
      },
    ];
  }

  if (propertyTypeId === "move") {
    return [
      {
        id: "move_out",
        label: "Move-out",
        description: "Leave it spotless for handover",
        serviceType: "move_out",
        serviceSlug: "move-out",
        badge: "Popular",
      },
      {
        id: "move_in",
        label: "Move-in",
        description: "Fresh start before you unpack",
        serviceType: "move_in",
        serviceSlug: "move-in",
      },
      {
        id: "deep",
        label: "Deep",
        description: "Extra detail when time allows",
        serviceType: "deep",
        serviceSlug: "deep",
      },
      {
        id: "pro",
        label: "Pro",
        description: "Specialist Pros for empty homes",
        serviceType: "move_out",
        serviceSlug: "move-out",
        badge: "Top Pros",
      },
    ];
  }

  if (propertyTypeId === "post_construction") {
    return [
      {
        id: "construction",
        label: "Construction",
        description: "Dust, debris, and finish clean",
        serviceType: "post_construction",
        serviceSlug: "post-construction",
        badge: "Recommended",
      },
      {
        id: "deep",
        label: "Deep",
        description: "When the heavy dust is already gone",
        serviceType: "deep",
        serviceSlug: "deep",
      },
      {
        id: "pro",
        label: "Pro",
        description: "Specialist post-reno Pros",
        serviceType: "post_construction",
        serviceSlug: "post-construction",
        badge: "Top Pros",
      },
    ];
  }

  // House, apt/condo, other — classic UberX-style ladder
  void property;
  return [
    {
      id: "standard",
      label: "Standard",
      description: "Regular clean for lived-in homes",
      serviceType: "standard",
      serviceSlug: "residential",
      badge: "Popular",
    },
    {
      id: "deep",
      label: "Deep",
      description: "Top-to-bottom with extra attention",
      serviceType: "deep",
      serviceSlug: "deep",
    },
    {
      id: "move",
      label: "Move",
      description: "Empty-home move-in or move-out",
      serviceType: "move_out",
      serviceSlug: "move-out",
    },
    {
      id: "pro",
      label: "Pro",
      description: "Top-rated Pros for premium cleans",
      serviceType: "deep",
      serviceSlug: "deep",
      badge: "Top Pros",
    },
  ];
}

export interface TierPricePreviewInput {
  serviceType: BookingServiceId;
  bedrooms: number;
  bathrooms: number;
  squareFootage: number;
  extrasCount?: number;
  /** Pro tier visual uplift — preview only; server still prices by serviceType. */
  proUpliftCents?: number;
}

export interface TierPricePreview {
  totalCents: number;
  durationMinutes: number;
  quoteOnly: boolean;
}

/** Instant card estimate (no market/tax) — display only. */
export function previewTierPrice(input: TierPricePreviewInput): TierPricePreview {
  if (isQuoteOnlyService(input.serviceType)) {
    return {
      totalCents: 0,
      quoteOnly: true,
      durationMinutes: estimateDurationMinutes({
        serviceType: input.serviceType,
        bedrooms: input.bedrooms,
        bathrooms: input.bathrooms,
        squareFootage: input.squareFootage,
        extrasCount: input.extrasCount ?? 0,
      }),
    };
  }

  const baseCents = SERVICE_BASE_CENTS[input.serviceType] ?? SERVICE_BASE_CENTS.standard;
  const subtotal =
    baseCents +
    input.bedrooms * BEDROOM_CENTS +
    input.bathrooms * BATHROOM_CENTS +
    squareFootageAdjustment(input.squareFootage) +
    (input.proUpliftCents ?? 0);
  const platformFee = Math.round(subtotal * (PLATFORM_FEE_PERCENT / 100));

  return {
    totalCents: subtotal + platformFee,
    quoteOnly: false,
    durationMinutes: estimateDurationMinutes({
      serviceType: input.serviceType,
      bedrooms: input.bedrooms,
      bathrooms: input.bathrooms,
      squareFootage: input.squareFootage,
      extrasCount: input.extrasCount ?? 0,
    }),
  };
}

/** Small visual uplift for Pro card when it shares a serviceType with Deep. */
export function proTierUpliftCents(tierId: string, serviceType: BookingServiceId): number {
  if (tierId !== "pro") return 0;
  // Keep server truth: create still sends serviceType. Uplift is display-only
  // unless we later add a dedicated pro SKU. Prefer honest Deep price for Pro.
  void serviceType;
  return 0;
}
