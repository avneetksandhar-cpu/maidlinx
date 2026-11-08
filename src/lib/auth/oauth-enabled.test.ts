import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";

describe("oauth-enabled", () => {
  const original = { ...process.env };

  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    process.env = { ...original };
  });

  it("shows Google by default and hides Apple until opted in", async () => {
    delete process.env.NEXT_PUBLIC_OAUTH_GOOGLE_ENABLED;
    process.env.NEXT_PUBLIC_OAUTH_APPLE_ENABLED = undefined;
    const mod = await import("./oauth-enabled");
    expect(mod.getEnabledOAuthProviders()).toEqual(["google"]);
  });

  it("hides Google when explicitly disabled", async () => {
    process.env.NEXT_PUBLIC_OAUTH_GOOGLE_ENABLED = "false";
    process.env.NEXT_PUBLIC_OAUTH_APPLE_ENABLED = undefined;
    const mod = await import("./oauth-enabled");
    expect(mod.getEnabledOAuthProviders()).toEqual([]);
  });

  it("returns Google then Apple when both enabled", async () => {
    process.env.NEXT_PUBLIC_OAUTH_APPLE_ENABLED = "true";
    process.env.NEXT_PUBLIC_OAUTH_GOOGLE_ENABLED = "true";
    const mod = await import("./oauth-enabled");
    expect(mod.getEnabledOAuthProviders()).toEqual(["google", "apple"]);
  });
});
