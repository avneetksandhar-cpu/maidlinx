import {
  BOOKING_EXTRAS,
  getBookingServiceLabel,
  type BookingExtraId,
  type BookingServiceId,
} from "@/lib/bookings/constants";
import { isQuoteOnlyService } from "@/config/services";
import { resolveMarketOrThrow } from "@/lib/markets/eligibility";
import type { BookingQuoteInput } from "@/lib/validations/booking-flow";
import {
  BATHROOM_CENTS,
  BEDROOM_CENTS,
  PLATFORM_FEE_PERCENT,
  estimateDurationMinutes,
  squareFootageAdjustment,
} from "@/lib/pricing/config";
import { getServiceBaseCentsForMarket } from "@/lib/pricing/market-prices";
import type { PriceBreakdown } from "@/lib/pricing/types";

export type { PriceBreakdown };

function extrasTotalCents(extras: BookingExtraId[]): number {
  return extras.reduce((sum, extraId) => {
    const extra = BOOKING_EXTRAS.find((item) => item.id === extraId);
    return sum + (extra?.priceCents ?? 0);
  }, 0);
}

export function calculateBookingPrice(input: BookingQuoteInput): PriceBreakdown {
  const serviceType = input.serviceType as BookingServiceId;
  const quoteOnly = isQuoteOnlyService(serviceType);
  const marketResolve = resolveMarketOrThrow({
    postalCode: input.postalCode,
    city: input.city,
    state: input.state,
    country: input.country,
  });
  const currency = marketResolve.market!.currency;
  const serviceLabel = getBookingServiceLabel(serviceType);

  if (quoteOnly) {
    return {
      baseCents: 0,
      bedroomCents: 0,
      bathroomCents: 0,
      squareFootageCents: 0,
      extrasCents: 0,
      subtotalCents: 0,
      platformFeeCents: 0,
      feesCents: 0,
      taxCents: 0,
      discountCents: 0,
      totalCents: 0,
      currency,
      quoteOnly: true,
      pricingModel: "quote",
      serviceLabel,
      estimatedDurationMinutes: estimateDurationMinutes({
        serviceType,
        bedrooms: input.bedrooms,
        bathrooms: input.bathrooms,
        squareFootage: input.squareFootage,
        extrasCount: input.extras.length,
      }),
    };
  }

  const baseCents = getServiceBaseCentsForMarket(marketResolve.market?.id, serviceType);
  const bedroomCents = input.bedrooms * BEDROOM_CENTS;
  const bathroomCents = input.bathrooms * BATHROOM_CENTS;
  const squareFootageCents = squareFootageAdjustment(input.squareFootage);
  const extrasCents = extrasTotalCents(input.extras as BookingExtraId[]);

  const subtotalCents = baseCents + bedroomCents + bathroomCents + squareFootageCents + extrasCents;
  const platformFeeCents = Math.round(subtotalCents * (PLATFORM_FEE_PERCENT / 100));
  const taxCents = 0;
  const discountCents = 0;
  const totalCents = subtotalCents + platformFeeCents + taxCents - discountCents;

  return {
    baseCents,
    bedroomCents,
    bathroomCents,
    squareFootageCents,
    extrasCents,
    subtotalCents,
    platformFeeCents,
    feesCents: platformFeeCents,
    taxCents,
    discountCents,
    totalCents,
    currency,
    quoteOnly: false,
    pricingModel: "instant",
    serviceLabel,
    estimatedDurationMinutes: estimateDurationMinutes({
      serviceType,
      bedrooms: input.bedrooms,
      bathrooms: input.bathrooms,
      squareFootage: input.squareFootage,
      extrasCount: input.extras.length,
    }),
  };
}

export function assertPriceMatch(
  clientTotalCents: number | undefined,
  serverTotalCents: number,
): void {
  if (typeof clientTotalCents !== "number") {
    throw new Error("Price mismatch. Client total is required.");
  }
  if (clientTotalCents !== serverTotalCents) {
    throw new Error("Price mismatch. Request a new quote.");
  }
}

/**
 * Apply a server-validated discount. Platform fee stays based on pre-discount subtotal
 * (customer still pays fee on service value; promo reduces payable total).
 */
export function withServerDiscount(
  pricing: PriceBreakdown,
  discountCents: number,
): PriceBreakdown {
  const safe = Math.max(0, Math.min(pricing.subtotalCents, Math.floor(discountCents)));
  return {
    ...pricing,
    discountCents: safe,
    totalCents: Math.max(
      0,
      pricing.subtotalCents + pricing.platformFeeCents + (pricing.taxCents ?? 0) - safe,
    ),
  };
}
