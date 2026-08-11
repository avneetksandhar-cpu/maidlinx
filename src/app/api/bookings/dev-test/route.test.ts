import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const insertBooking = vi.fn();
const upsertPaymentRecord = vi.fn();
const getBookingById = vi.fn();
const emitBookingEvent = vi.fn();
const notifyBookingConfirmed = vi.fn();
const getSession = vi.fn();
const hasAdminEnv = vi.fn(() => true);
const createAdminClient = vi.fn();
const createBookingAccessToken = vi.fn(() => "token");

vi.mock("@/lib/auth/session", () => ({
  getSession: () => getSession(),
}));

vi.mock("@/lib/bookings/repository", () => ({
  insertBooking,
  upsertPaymentRecord,
  getBookingById,
}));

vi.mock("@/lib/bookings/events", () => ({
  emitBookingEvent,
}));

vi.mock("@/lib/notifications", () => ({
  notifyBookingConfirmed,
}));

vi.mock("@/lib/supabase/admin", () => ({
  hasAdminEnv: () => hasAdminEnv(),
  createAdminClient: () => createAdminClient(),
}));

vi.mock("@/lib/bookings/access-token", () => ({
  createBookingAccessToken: () => createBookingAccessToken(),
}));

describe("POST /api/bookings/dev-test production lock", () => {
  beforeEach(() => {
    vi.resetModules();
    insertBooking.mockReset();
    upsertPaymentRecord.mockReset();
    getBookingById.mockReset();
    emitBookingEvent.mockReset();
    notifyBookingConfirmed.mockReset();
    getSession.mockReset();
    hasAdminEnv.mockReset();
    hasAdminEnv.mockReturnValue(true);
    createAdminClient.mockReset();
    createBookingAccessToken.mockReset();
    createBookingAccessToken.mockReturnValue("token");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns 403 and creates no booking in production even when ALLOW_* is true", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("ALLOW_DEV_TEST_BOOKING", "true");
    vi.stubEnv("ALLOW_DEV_BOOKING", "true");

    const { POST } = await import("./route");
    const response = await POST(
      new Request("http://localhost/api/bookings/dev-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientTotalCents: 10000 }),
      }),
    );

    expect(response.status).toBe(403);
    const body = (await response.json()) as { error?: string; code?: string };
    expect(body.code).toBe("DEV_TEST_BOOKING_DISABLED");
    expect(body.error).toMatch(/disabled/i);
    expect(insertBooking).not.toHaveBeenCalled();
    expect(upsertPaymentRecord).not.toHaveBeenCalled();
  });

  it("GET reports enabled=false in production even when ALLOW_* is true", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("ALLOW_DEV_TEST_BOOKING", "true");
    vi.stubEnv("ALLOW_DEV_BOOKING", "true");

    const { GET } = await import("./route");
    const response = await GET();
    expect(response.status).toBe(200);
    const body = (await response.json()) as { data: { enabled: boolean } };
    expect(body.data.enabled).toBe(false);
  });
});
