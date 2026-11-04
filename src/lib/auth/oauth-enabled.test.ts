import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";

describe("oauth-enabled", () => {
  const original = { ...process.env };

  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    process.env = { ...original };
  });

  it("hides providers unless public enable flags are true", async () => {
    process.env.NEXT_PUBLIC_OAUTH_GOOGLE_ENABLED = "false";
    process.env.NEXT_PUBLIC_OAUTH_APPLE_ENABLED = undefined;
    const mod = await import("./oauth-enabled");
    expect(mod.getEnabledOAuthProviders()).toEqual([]);
  });

  it("returns only enabled providers in Apple-first order", async () => {
    process.env.NEXT_PUBLIC_OAUTH_APPLE_ENABLED = "true";
    process.env.NEXT_PUBLIC_OAUTH_GOOGLE_ENABLED = "true";
    const mod = await import("./oauth-enabled");
    expect(mod.getEnabledOAuthProviders()).toEqual(["apple", "google"]);
  });
});
