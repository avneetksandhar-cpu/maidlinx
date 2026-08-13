import { beforeEach, describe, expect, it, vi } from "vitest";
import { resetRateLimitBuckets } from "@/lib/api/rate-limit";

vi.mock("@/lib/waitlist/repository", () => ({
  joinLaunchWaitlist: vi.fn(async () => ({
    ok: true,
    id: "00000000-0000-0000-0000-000000000001",
    alreadyJoined: false,
  })),
  listLaunchWaitlist: vi.fn(async () => ({
    items: [],
    count: 0,
    available: true,
  })),
}));

vi.mock("@/lib/waitlist/notify", () => ({
  sendWaitlistConfirmationEmail: vi.fn(async () => ({ sent: false, provider: "log" })),
}));

vi.mock("@/lib/ai/session", () => ({
  requireOwnerSession: vi.fn(async () => ({ id: "admin" })),
}));

import { POST, GET } from "@/app/api/waitlist/route";
import { joinLaunchWaitlist } from "@/lib/waitlist/repository";

describe("POST /api/waitlist", () => {
  beforeEach(() => {
    resetRateLimitBuckets();
    vi.clearAllMocks();
  });

  it("accepts a valid signup", async () => {
    const res = await POST(
      new Request("http://localhost/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-forwarded-for": "1.2.3.4" },
        body: JSON.stringify({
          email: "launch@example.com",
          name: "Test",
          marketId: "TORONTO_GTA",
          source: "homepage_hero",
          page: "/",
        }),
      }),
    );
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.data.joined).toBe(true);
    expect(joinLaunchWaitlist).toHaveBeenCalled();
  });

  it("rejects invalid email", async () => {
    const res = await POST(
      new Request("http://localhost/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-forwarded-for": "1.2.3.5" },
        body: JSON.stringify({ email: "nope" }),
      }),
    );
    expect(res.status).toBe(400);
  });

  it("rate limits repeated joins from same IP", async () => {
    for (let i = 0; i < 8; i++) {
      const res = await POST(
        new Request("http://localhost/api/waitlist", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-forwarded-for": "9.9.9.9" },
          body: JSON.stringify({ email: `u${i}@example.com` }),
        }),
      );
      expect(res.status).toBe(201);
    }
    const blocked = await POST(
      new Request("http://localhost/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-forwarded-for": "9.9.9.9" },
        body: JSON.stringify({ email: "last@example.com" }),
      }),
    );
    expect(blocked.status).toBe(429);
    const body = await blocked.json();
    expect(body.code).toBe("RATE_LIMITED");
  });
});

describe("GET /api/waitlist", () => {
  it("returns list for owner session", async () => {
    const res = await GET(new Request("http://localhost/api/waitlist"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.available).toBe(true);
  });
});
