import { describe, expect, it } from "vitest";
import { waitlistSignupSchema } from "@/lib/waitlist/schema";

describe("waitlistSignupSchema", () => {
  it("requires a valid email", () => {
    const bad = waitlistSignupSchema.safeParse({ email: "not-an-email" });
    expect(bad.success).toBe(false);

    const ok = waitlistSignupSchema.safeParse({
      email: "  hello@maidlinx.com ",
      name: "  Avnee ",
      marketId: "TORONTO_GTA",
      source: "homepage_hero",
      page: "/",
    });
    expect(ok.success).toBe(true);
    if (ok.success) {
      expect(ok.data.email).toBe("hello@maidlinx.com");
      expect(ok.data.name).toBe("Avnee");
      expect(ok.data.marketId).toBe("TORONTO_GTA");
    }
  });

  it("normalizes empty optional fields to null", () => {
    const ok = waitlistSignupSchema.safeParse({
      email: "a@b.co",
      name: "   ",
      marketId: "",
      source: null,
    });
    expect(ok.success).toBe(true);
    if (ok.success) {
      expect(ok.data.name).toBeNull();
      expect(ok.data.marketId).toBeNull();
      expect(ok.data.source).toBeNull();
    }
  });
});
