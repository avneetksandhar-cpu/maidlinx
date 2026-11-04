import { MIN_BOOKING_CENTS, type ServiceType, type WingmanStatus } from "@/lib/marketplace/constants";

export type OfferGateInput = {
  wingmanStatus: WingmanStatus | null;
  operatorApproved: boolean;
  expiresAt: Date | string | null;
  inventoryQuantity: number;
  serviceType: ServiceType | string | null;
  terms: string | null;
  serviceFeeCents: number | null;
  now?: Date;
};

export type PriceBreakdown = {
  subtotalCents: number;
  serviceFeeCents: number;
  taxesCents: number;
  customerFeeCents: number;
  totalCents: number;
};

export function offerIsBookable(input: OfferGateInput): boolean {
  if (input.wingmanStatus !== "verified") return false;
  if (!input.operatorApproved) return false;
  if (!input.expiresAt) return false;
  const expires = input.expiresAt instanceof Date ? input.expiresAt : new Date(input.expiresAt);
  const now = input.now ?? new Date();
  if (!(expires.getTime() > now.getTime())) return false;
  if (input.inventoryQuantity <= 0) return false;
  if (!input.serviceType) return false;
  if (!input.terms || !input.terms.trim()) return false;
  if (input.serviceFeeCents == null || input.serviceFeeCents < 0) return false;
  return true;
}

export function eventShowsBookWithWingman(args: {
  discoveryStatus: string;
  hasBookableOffer: boolean;
  bookingStatus?: string;
}): boolean {
  if (args.discoveryStatus === "cancelled" || args.discoveryStatus === "expired") return false;
  if (args.bookingStatus && args.bookingStatus !== "VERIFIED_AVAILABLE") return false;
  if (args.bookingStatus === "VERIFIED_AVAILABLE") return args.hasBookableOffer;
  return args.hasBookableOffer;
}

export function computeQuoteTotal(input: {
  subtotalCents: number;
  serviceFeeCents: number;
  taxesCents: number;
  customerFeeBps: number;
}): PriceBreakdown {
  const customerFeeCents = Math.round((input.subtotalCents * input.customerFeeBps) / 10_000);
  const totalCents =
    input.subtotalCents + input.serviceFeeCents + input.taxesCents + customerFeeCents;
  return {
    subtotalCents: input.subtotalCents,
    serviceFeeCents: input.serviceFeeCents,
    taxesCents: input.taxesCents,
    customerFeeCents,
    totalCents,
  };
}

export function meetsMinimumBooking(totalCents: number, minCents = MIN_BOOKING_CENTS): boolean {
  return totalCents >= minCents;
}

export function supplierCommissionCents(subtotalCents: number, supplierCommissionBps: number): number {
  return Math.round((subtotalCents * supplierCommissionBps) / 10_000);
}

export const PUBLIC_WINGMAN_FIELDS = [
  "displayName",
  "photoUrl",
  "verificationStatus",
  "areas",
  "specialties",
  "languages",
  "responseWindowMinutes",
  "biography",
] as const;

export const PRIVATE_WINGMAN_FIELDS = [
  "legalName",
  "identityDocuments",
  "payoutDetails",
  "verificationEvidence",
  "publicContact",
  "internalNotes",
] as const;
