import { getServiceByLegacyType, getServiceById } from "@/config/services";
import { estimateDurationMinutes } from "@/lib/pricing/config";
import type { BookingServiceId } from "@/lib/bookings/constants";

export function estimateJobDurationMinutes(input: {
  serviceType: string;
  serviceId?: string | null;
  bedrooms: number;
  bathrooms: number;
  squareFootage: number | null;
  extrasCount: number;
}): number {
  const marketplace =
    (input.serviceId ? getServiceById(input.serviceId) : undefined) ??
    getServiceByLegacyType(input.serviceType);

  if (marketplace) {
    const rules = marketplace.estimatedDurationRules;
    const sizeTierMinutes =
      (rules.minutesPerSizeTier ?? 0) *
      Math.max(0, Math.floor(((input.squareFootage ?? 1000) - 1000) / 500));
    return (
      rules.baseMinutes +
      (rules.minutesPerBedroom ?? 0) * input.bedrooms +
      (rules.minutesPerBathroom ?? 0) * input.bathrooms +
      (rules.minutesPerExtra ?? 0) * input.extrasCount +
      sizeTierMinutes
    );
  }

  const legacyTypes: BookingServiceId[] = [
    "standard",
    "deep",
    "move_in",
    "move_out",
    "office",
    "airbnb_turnover",
  ];
  const serviceType = legacyTypes.includes(input.serviceType as BookingServiceId)
    ? (input.serviceType as BookingServiceId)
    : "standard";

  return estimateDurationMinutes({
    serviceType,
    bedrooms: input.bedrooms,
    bathrooms: input.bathrooms,
    squareFootage: input.squareFootage ?? 1000,
    extrasCount: input.extrasCount,
  });
}

export function formatDurationMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rem = minutes % 60;
  if (rem === 0) return `${hours} hr`;
  return `${hours} hr ${rem} min`;
}
