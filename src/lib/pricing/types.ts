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
  /** Public discount lines (promo / recurring) for review UI — never includes cost formulas. */
  discountLines?: Array<{
    type: "promo" | "referral" | "recurring" | "experiment" | "other";
    label: string;
    amountCents: number;
    code?: string;
  }>;
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
