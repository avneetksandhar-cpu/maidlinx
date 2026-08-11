import { createHmac, timingSafeEqual } from "crypto";

function getSecret(): string {
  const secret =
    process.env.BOOKING_ACCESS_SECRET ??
    process.env.STRIPE_WEBHOOK_SECRET ??
    (process.env.NODE_ENV === "production" ? undefined : "dev-booking-access-secret");

  if (!secret) {
    throw new Error("BOOKING_ACCESS_SECRET or STRIPE_WEBHOOK_SECRET is required.");
  }

  return secret;
}

export function createBookingAccessToken(bookingId: string): string {
  return createHmac("sha256", getSecret()).update(bookingId).digest("base64url");
}

export function verifyBookingAccessToken(bookingId: string, token: string | null | undefined): boolean {
  if (!token) return false;

  const expected = createBookingAccessToken(bookingId);

  try {
    const a = Buffer.from(token);
    const b = Buffer.from(expected);
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
