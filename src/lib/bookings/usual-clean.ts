import type { BookingState } from "@/lib/bookings/booking-state";
import type { PropertyTypeId } from "@/lib/bookings/booking-state";
import type { BookingExtraId, BookingServiceId, ArrivalWindowId } from "@/lib/bookings/constants";

export const USUAL_CLEAN_STORAGE_KEY = "maidlinx_usual_clean";
export const RECENT_ADDRESSES_STORAGE_KEY = "maidlinx_recent_addresses";

export interface UsualCleanProfile {
  label?: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  latitude?: number;
  longitude?: number;
  googlePlaceId?: string;
  formattedAddress?: string;
  propertyType?: PropertyTypeId;
  serviceType?: BookingServiceId;
  serviceSlug?: string;
  serviceTile?: BookingState["serviceTile"];
  bedrooms?: number;
  bathrooms?: number;
  squareFootage?: number;
  extras?: BookingExtraId[];
  arrivalWindow?: ArrivalWindowId;
  serviceAnswers?: BookingState["serviceAnswers"];
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  savedAt: string;
}

export interface RecentGuestAddress {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  latitude?: number;
  longitude?: number;
  googlePlaceId?: string;
  formattedAddress?: string;
  label?: string;
  savedAt: string;
}

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function readUsualClean(): UsualCleanProfile | null {
  if (!canUseStorage()) return null;
  try {
    const raw = localStorage.getItem(USUAL_CLEAN_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as UsualCleanProfile;
  } catch {
    return null;
  }
}

export function saveUsualClean(state: BookingState): UsualCleanProfile | null {
  if (!canUseStorage() || !state.line1 || !state.serviceType) return null;

  const profile: UsualCleanProfile = {
    label: "Home",
    line1: state.line1,
    line2: state.line2,
    city: state.city ?? "",
    state: state.state ?? "",
    postalCode: state.postalCode ?? "",
    country: state.country ?? "US",
    latitude: state.latitude,
    longitude: state.longitude,
    googlePlaceId: state.googlePlaceId,
    formattedAddress: state.formattedAddress,
    propertyType: state.propertyType,
    serviceType: state.serviceType,
    serviceSlug: state.serviceSlug,
    serviceTile: state.serviceTile,
    bedrooms: state.bedrooms,
    bathrooms: state.bathrooms,
    squareFootage: state.squareFootage,
    extras: state.extras,
    arrivalWindow: state.arrivalWindow as ArrivalWindowId | undefined,
    serviceAnswers: state.serviceAnswers,
    firstName: state.firstName,
    lastName: state.lastName,
    email: state.email,
    phone: state.phone,
    savedAt: new Date().toISOString(),
  };

  try {
    localStorage.setItem(USUAL_CLEAN_STORAGE_KEY, JSON.stringify(profile));
  } catch {
    return profile;
  }
  return profile;
}

export function usualCleanToBookingPatch(profile: UsualCleanProfile): Partial<BookingState> {
  return {
    line1: profile.line1,
    line2: profile.line2,
    city: profile.city,
    state: profile.state,
    postalCode: profile.postalCode,
    country: profile.country,
    latitude: profile.latitude,
    longitude: profile.longitude,
    googlePlaceId: profile.googlePlaceId,
    formattedAddress: profile.formattedAddress,
    propertyType: profile.propertyType,
    serviceType: profile.serviceType,
    serviceSlug: profile.serviceSlug,
    serviceTile: profile.serviceTile,
    bedrooms: profile.bedrooms,
    bathrooms: profile.bathrooms,
    squareFootage: profile.squareFootage,
    extras: profile.extras ?? [],
    arrivalWindow: profile.arrivalWindow,
    serviceAnswers: profile.serviceAnswers ?? {},
    firstName: profile.firstName,
    lastName: profile.lastName,
    email: profile.email,
    phone: profile.phone,
    step: 5,
  };
}

export function readRecentGuestAddresses(): RecentGuestAddress[] {
  if (!canUseStorage()) return [];
  try {
    const raw = localStorage.getItem(RECENT_ADDRESSES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as RecentGuestAddress[];
    return Array.isArray(parsed) ? parsed.slice(0, 5) : [];
  } catch {
    return [];
  }
}

export function pushRecentGuestAddress(address: Omit<RecentGuestAddress, "savedAt">) {
  if (!canUseStorage() || !address.line1) return;
  const next: RecentGuestAddress = { ...address, savedAt: new Date().toISOString() };
  const existing = readRecentGuestAddresses().filter(
    (item) =>
      !(
        item.googlePlaceId &&
        next.googlePlaceId &&
        item.googlePlaceId === next.googlePlaceId
      ) &&
      !(
        item.line1 === next.line1 &&
        item.postalCode === next.postalCode &&
        item.city === next.city
      ),
  );
  try {
    localStorage.setItem(
      RECENT_ADDRESSES_STORAGE_KEY,
      JSON.stringify([next, ...existing].slice(0, 5)),
    );
  } catch {
    // Ignore quota errors.
  }
}
