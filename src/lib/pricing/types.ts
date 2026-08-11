export interface PriceBreakdown {
  baseCents: number;
  bedroomCents: number;
  bathroomCents: number;
  squareFootageCents: number;
  extrasCents: number;
  subtotalCents: number;
  platformFeeCents: number;
  /** Alias for platform fee shown as Fees in quote UI. */
  feesCents?: number;
  taxCents?: number;
  discountCents?: number;
  totalCents: number;
  currency: "USD" | "CAD";
  estimatedDurationMinutes?: number;
  /** True when commercial / specialty services require a human quote. */
  quoteOnly?: boolean;
  pricingModel?: "instant" | "quote";
  serviceLabel?: string;
  /** Present on authoritative quotes issued by /api/bookings/quote. */
  quoteId?: string;
  quoteToken?: string;
  expiresAt?: string;
  couponCode?: string | null;
}
