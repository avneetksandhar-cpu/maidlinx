import type { BookingStatus } from "@/lib/events/types";

export function computeBookingStatus(args: {
  cancelled?: boolean;
  hasVerifiedAvailableOffer: boolean;
}): BookingStatus {
  if (args.cancelled) return "CANCELLED";
  if (args.hasVerifiedAvailableOffer) return "VERIFIED_AVAILABLE";
  return "DISCOVERY_ONLY";
}

export function isVerifiedAvailable(status: string | null | undefined): boolean {
  return status === "VERIFIED_AVAILABLE";
}
