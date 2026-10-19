/**
 * Homepage / marketing starting price — must match calculateBookingPrice
 * for the same typical-home inputs (never invent a different number).
 */

import { calculateBookingPrice } from "@/lib/pricing/calculateQuote";
import type { PriceBreakdown } from "@/lib/pricing/types";
import type { BookingQuoteInput } from "@/lib/validations/booking-flow";

/** Typical occupied home used for “from” estimates on marketing surfaces. */
export const TYPICAL_HOME_QUOTE = {
  serviceType: "standard" as const,
  bedrooms: 2,
  bathrooms: 1,
  squareFootage: 1000,
  extras: [] as BookingQuoteInput["extras"],
};

/** In-market sample addresses so currency/market resolve the same as checkout. */
export const MARKET_QUOTE_SAMPLES = {
  TORONTO_GTA: {
    line1: "100 King St W",
    city: "Toronto",
    state: "ON",
    postalCode: "M5V1A1",
    country: "CA",
  },
  SOUTH_FLORIDA: {
    line1: "100 Ocean Dr",
    city: "Miami Beach",
    state: "FL",
    postalCode: "33139",
    country: "US",
  },
} as const;

export type LaunchQuoteMarketId = keyof typeof MARKET_QUOTE_SAMPLES;

export function typicalHomeEstimateForMarket(marketId: LaunchQuoteMarketId): PriceBreakdown {
  const sample = MARKET_QUOTE_SAMPLES[marketId];
  return calculateBookingPrice({
    ...sample,
    ...TYPICAL_HOME_QUOTE,
  });
}

/** Estimate for a customer address already resolved into a served market. */
export function typicalHomeEstimateForAddress(input: {
  line1?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}): PriceBreakdown {
  return calculateBookingPrice({
    line1: input.line1?.trim() || "Address",
    city: input.city,
    state: input.state,
    postalCode: input.postalCode,
    country: input.country,
    ...TYPICAL_HOME_QUOTE,
  });
}

export const PRICE_DRIVER_COPY =
  "Your price changes with home size, bathrooms, cleaning type, and extras. Checkout uses the same server quote — never a different number.";
