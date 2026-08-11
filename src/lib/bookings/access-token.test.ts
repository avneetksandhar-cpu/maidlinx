import { describe, expect, it } from "vitest";
import {
  createBookingAccessToken,
  verifyBookingAccessToken,
} from "@/lib/bookings/access-token";

describe("booking access token", () => {
  const bookingId = "550e8400-e29b-41d4-a716-446655440000";

  it("creates a verifiable token", () => {
    const token = createBookingAccessToken(bookingId);
    expect(token.length).toBeGreaterThan(10);
    expect(verifyBookingAccessToken(bookingId, token)).toBe(true);
  });

  it("rejects invalid tokens", () => {
    expect(verifyBookingAccessToken(bookingId, "invalid")).toBe(false);
    expect(verifyBookingAccessToken(bookingId, null)).toBe(false);
    expect(verifyBookingAccessToken("other-id", createBookingAccessToken(bookingId))).toBe(false);
  });
});
