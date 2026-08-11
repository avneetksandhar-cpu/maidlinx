import { describe, expect, it } from "vitest";
import { deriveConnectStatus } from "@/lib/stripe/connect";

describe("deriveConnectStatus", () => {
  it("maps Stripe flags to the Connect status machine", () => {
    expect(deriveConnectStatus({})).toBe("NOT_STARTED");
    expect(deriveConnectStatus({ detailsSubmitted: true })).toBe("PENDING");
    expect(
      deriveConnectStatus({ chargesEnabled: true, payoutsEnabled: true }),
    ).toBe("ENABLED");
    expect(deriveConnectStatus({ disabledReason: "rejected.fraud" })).toBe("RESTRICTED");
  });
});
