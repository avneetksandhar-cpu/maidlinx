import type { SavedAddress, StructuredAddress } from "@/lib/addresses/types";
import type { Step1Address } from "@/lib/validations/booking-flow";

/** Map API / DB saved address into booking form fields (line1/state naming). */
export function structuredToBookingAddress(
  address: StructuredAddress,
): Partial<Step1Address> {
  return {
    line1: address.addressLine1,
    line2: address.unit || undefined,
    city: address.city,
    state: address.region,
    postalCode: address.postalCode,
    country: address.countryCode || address.country || "US",
    latitude: address.latitude,
    longitude: address.longitude,
    googlePlaceId: address.placeId,
    formattedAddress: address.formattedAddress,
    streetNumber: address.streetNumber,
    route: address.route,
  };
}

export function bookingToStructuredAddress(
  value: Partial<Step1Address>,
): StructuredAddress | null {
  const line1 = value.line1?.trim();
  const city = value.city?.trim();
  const region = value.state?.trim();
  const postalCode = value.postalCode?.trim();
  const countryCode = (value.country ?? "US").trim().toUpperCase();

  if (!line1 || !city || !region || !postalCode) return null;

  return {
    formattedAddress: value.formattedAddress?.trim() || undefined,
    addressLine1: line1,
    unit: value.line2?.trim() || undefined,
    city,
    region,
    postalCode,
    country: countryCode,
    countryCode,
    latitude: value.latitude,
    longitude: value.longitude,
    placeId: value.googlePlaceId,
    streetNumber: value.streetNumber?.trim() || undefined,
    route: value.route?.trim() || undefined,
  };
}

export function hasStructuredPlace(value: Partial<Step1Address>): boolean {
  return Boolean(
    value.googlePlaceId &&
      value.line1?.trim() &&
      value.city?.trim() &&
      value.state?.trim() &&
      value.postalCode?.trim(),
  );
}

export function formatAddressSummary(address: StructuredAddress | SavedAddress): string {
  if (address.formattedAddress?.trim()) return address.formattedAddress.trim();
  const unit = address.unit?.trim();
  const line = unit ? `${address.addressLine1}, ${unit}` : address.addressLine1;
  return `${line}, ${address.city}, ${address.region} ${address.postalCode}`;
}
