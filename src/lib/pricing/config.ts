import type { BookingExtraId, BookingServiceId } from "@/lib/bookings/constants";

export const SERVICE_BASE_CENTS: Record<BookingServiceId, number> = {
  standard: 12000,
  deep: 20000,
  move_in: 25000,
  move_out: 25000,
  office: 18000,
  airbnb_turnover: 15000,
  post_construction: 35000,
  event_venue: 28000,
};

export const BEDROOM_CENTS = 2500;
export const BATHROOM_CENTS = 1500;
export const PLATFORM_FEE_PERCENT = 15;

export const SQUARE_FOOTAGE_TIERS = [
  { max: 1000, adjustmentCents: 0, label: "Up to 1,000 sq ft" },
  { max: 2000, adjustmentCents: 3000, label: "1,001 – 2,000 sq ft" },
  { max: 3000, adjustmentCents: 6000, label: "2,001 – 3,000 sq ft" },
  { max: Infinity, adjustmentCents: 9000, label: "3,001+ sq ft" },
] as const;

export const EXTRA_PRICES: Record<BookingExtraId, number> = {
  inside_fridge: 2500,
  inside_oven: 2500,
  inside_cabinets: 3500,
  laundry: 2000,
  windows: 4000,
  garage: 3000,
  patio: 2500,
};

export function squareFootageAdjustment(squareFootage: number): number {
  for (const tier of SQUARE_FOOTAGE_TIERS) {
    if (squareFootage <= tier.max) return tier.adjustmentCents;
  }
  const lastTier = SQUARE_FOOTAGE_TIERS[SQUARE_FOOTAGE_TIERS.length - 1];
  return lastTier?.adjustmentCents ?? 0;
}

export function estimateDurationMinutes(input: {
  serviceType: BookingServiceId;
  bedrooms: number;
  bathrooms: number;
  squareFootage: number;
  extrasCount: number;
}): number {
  const baseByService: Record<BookingServiceId, number> = {
    standard: 120,
    deep: 180,
    move_in: 210,
    move_out: 210,
    office: 150,
    airbnb_turnover: 90,
    post_construction: 240,
    event_venue: 180,
  };

  const base = baseByService[input.serviceType];
  const roomMinutes = input.bedrooms * 20 + input.bathrooms * 15;
  const sizeMinutes = Math.max(0, Math.floor((input.squareFootage - 1000) / 500)) * 15;
  const extrasMinutes = input.extrasCount * 20;

  return base + roomMinutes + sizeMinutes + extrasMinutes;
}
