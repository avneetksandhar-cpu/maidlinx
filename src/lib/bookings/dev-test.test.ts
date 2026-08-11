import { afterEach, describe, expect, it, vi } from "vitest";
import {
  assertDevTestBookingEnabled,
  isDevTestBookingEnabled,
} from "@/lib/bookings/dev-test";

describe("DEV_TEST_BOOKING gate", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("is disabled in production even when ALLOW_* flags are true", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("ALLOW_DEV_BOOKING", "true");
    vi.stubEnv("ALLOW_DEV_TEST_BOOKING", "true");
    expect(isDevTestBookingEnabled()).toBe(false);
    expect(() => assertDevTestBookingEnabled()).toThrow(/disabled/i);
  });

  it("defaults to disabled when allow flags are missing", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("ALLOW_DEV_BOOKING", "");
    vi.stubEnv("ALLOW_DEV_TEST_BOOKING", "");
    expect(isDevTestBookingEnabled()).toBe(false);
  });

  it("allows ALLOW_DEV_TEST_BOOKING in development", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("ALLOW_DEV_BOOKING", "");
    vi.stubEnv("ALLOW_DEV_TEST_BOOKING", "true");
    expect(isDevTestBookingEnabled()).toBe(true);
    expect(() => assertDevTestBookingEnabled()).not.toThrow();
  });

  it("allows ALLOW_DEV_BOOKING alias in development", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("ALLOW_DEV_BOOKING", "true");
    vi.stubEnv("ALLOW_DEV_TEST_BOOKING", "");
    expect(isDevTestBookingEnabled()).toBe(true);
  });
});
