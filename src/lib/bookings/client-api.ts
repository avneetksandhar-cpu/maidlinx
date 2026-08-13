import type { PriceBreakdown } from "@/lib/pricing/calculate";
import type { CreateBookingRequest, BookingQuoteInput } from "@/lib/validations/booking-flow";
import type { StoredBooking } from "@/lib/bookings/repository";
import { isPaidBookingStatus, normalizeBookingStatus } from "@/lib/bookings/status";

const BOOKING_ACCESS_STORAGE_KEY = "maidlinx_booking_access";

function bookingAccessKey(bookingId: string): string {
  return `${BOOKING_ACCESS_STORAGE_KEY}:${bookingId}`;
}

export function storeBookingAccessToken(bookingId: string, token: string): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(bookingAccessKey(bookingId), token);
}

export function getStoredBookingAccessToken(bookingId: string): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(bookingAccessKey(bookingId));
}

function bookingAccessHeaders(accessToken?: string | null): HeadersInit {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (accessToken) {
    headers["X-Booking-Access-Token"] = accessToken;
  }
  return headers;
}

async function parseJson<T>(response: Response): Promise<T> {
  const payload = await response.json();
  if (!response.ok) {
    if (payload.code === "BOOKING_DISABLED") {
      throw new Error(
        payload.error ??
          "Booking isn’t open in this market yet. Join the waitlist to get notified.",
      );
    }
    throw new Error(payload.error ?? "Request failed.");
  }
  return payload.data as T;
}

export async function fetchBookingQuote(input: BookingQuoteInput): Promise<PriceBreakdown> {
  const response = await fetch("/api/bookings/quote", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  const data = await parseJson<{ pricing: PriceBreakdown }>(response);
  return data.pricing;
}

export async function createBooking(
  input: CreateBookingRequest,
  clientTotalCents: number,
): Promise<{ booking: StoredBooking; pricing: PriceBreakdown; accessToken: string }> {
  const response = await fetch("/api/bookings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...input, clientTotalCents }),
  });

  const data = await parseJson<{
    booking: StoredBooking;
    pricing: PriceBreakdown;
    accessToken: string;
  }>(response);

  storeBookingAccessToken(data.booking.id, data.accessToken);
  return data;
}

export async function startBookingCheckout(
  bookingId: string,
  accessToken?: string | null,
  consent?: {
    legalConsentAccepted: boolean;
    legalConsentPolicyVersion: string;
  },
): Promise<{
  clientSecret: string;
  paymentIntentId: string;
  amountCents: number;
  depositCents: number;
  totalCents: number;
  depositPercent: number;
  paymentType: string;
  reused?: boolean;
  legalConsentPolicyVersion?: string;
}> {
  const token = accessToken ?? getStoredBookingAccessToken(bookingId);
  const response = await fetch(`/api/bookings/${bookingId}/checkout`, {
    method: "POST",
    headers: bookingAccessHeaders(token),
    body: JSON.stringify({
      accessToken: token,
      legalConsentAccepted: consent?.legalConsentAccepted === true,
      legalConsentPolicyVersion: consent?.legalConsentPolicyVersion,
    }),
  });

  return parseJson<{
    clientSecret: string;
    paymentIntentId: string;
    amountCents: number;
    depositCents: number;
    totalCents: number;
    depositPercent: number;
    paymentType: string;
    reused?: boolean;
    legalConsentPolicyVersion?: string;
  }>(response);
}

export async function confirmBookingPaymentSync(
  bookingId: string,
  accessToken?: string | null,
  paymentIntentId?: string | null,
): Promise<StoredBooking> {
  const token = accessToken ?? getStoredBookingAccessToken(bookingId);
  const response = await fetch(`/api/bookings/${bookingId}/confirm-payment`, {
    method: "POST",
    headers: bookingAccessHeaders(token),
    body: JSON.stringify({ accessToken: token, paymentIntentId }),
  });
  const data = await parseJson<{ booking: StoredBooking }>(response);
  return data.booking;
}

export async function fetchDevTestBookingEnabled(): Promise<boolean> {
  try {
    const response = await fetch("/api/bookings/dev-test", { method: "GET" });
    if (!response.ok) return false;
    const data = await parseJson<{ enabled: boolean }>(response);
    return Boolean(data.enabled);
  } catch {
    return false;
  }
}

export async function createDevTestBooking(
  input: CreateBookingRequest,
  clientTotalCents: number,
): Promise<{ booking: StoredBooking; pricing: PriceBreakdown; accessToken: string }> {
  const response = await fetch("/api/bookings/dev-test", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...input, clientTotalCents }),
  });

  const data = await parseJson<{
    booking: StoredBooking;
    pricing: PriceBreakdown;
    accessToken: string;
  }>(response);

  storeBookingAccessToken(data.booking.id, data.accessToken);
  return data;
}

export async function fetchBooking(
  bookingId: string,
  accessToken?: string | null,
): Promise<StoredBooking> {
  const token = accessToken ?? getStoredBookingAccessToken(bookingId);
  const query = token ? `?token=${encodeURIComponent(token)}` : "";
  const response = await fetch(`/api/bookings/${bookingId}${query}`, {
    headers: bookingAccessHeaders(token),
  });
  const data = await parseJson<{ booking: StoredBooking }>(response);
  return data.booking;
}

export function isBookingPaymentConfirmed(status: string): boolean {
  return isPaidBookingStatus(normalizeBookingStatus(status));
}

export async function pollBookingUntilConfirmed(
  bookingId: string,
  accessToken?: string | null,
  options?: { maxAttempts?: number; intervalMs?: number },
): Promise<StoredBooking> {
  const maxAttempts = options?.maxAttempts ?? 30;
  const intervalMs = options?.intervalMs ?? 1000;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const booking = await fetchBooking(bookingId, accessToken);
    if (isBookingPaymentConfirmed(booking.status)) {
      return booking;
    }
    if (booking.status === "cancelled") {
      throw new Error("This booking was cancelled.");
    }
    if (attempt < maxAttempts - 1) {
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }
  }

  throw new Error(
    "Payment confirmation is taking longer than expected. Refresh this page or check your email shortly.",
  );
}
