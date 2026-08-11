import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import {
  USUAL_CLEAN_STORAGE_KEY,
  RECENT_ADDRESSES_STORAGE_KEY,
  readUsualClean,
  saveUsualClean,
  usualCleanToBookingPatch,
  pushRecentGuestAddress,
  readRecentGuestAddresses,
} from "@/lib/bookings/usual-clean";
import type { BookingState } from "@/lib/bookings/booking-state";

function installMemoryStorage() {
  const store = new Map<string, string>();
  const memory: Storage = {
    get length() {
      return store.size;
    },
    clear: () => store.clear(),
    getItem: (key) => store.get(key) ?? null,
    key: (index) => Array.from(store.keys())[index] ?? null,
    removeItem: (key) => {
      store.delete(key);
    },
    setItem: (key, value) => {
      store.set(key, value);
    },
  };
  vi.stubGlobal("localStorage", memory);
  vi.stubGlobal("window", { localStorage: memory });
}

describe("usual clean persistence", () => {
  beforeEach(() => {
    installMemoryStorage();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("saves and reads a usual clean profile", () => {
    const state = {
      line1: "100 Queen St W",
      city: "Toronto",
      state: "ON",
      postalCode: "M5H 2N2",
      country: "CA",
      serviceType: "standard",
      propertyType: "house",
      bedrooms: 2,
      bathrooms: 2,
      squareFootage: 1500,
      extras: ["laundry"],
      arrivalWindow: "morning",
    } as BookingState;

    saveUsualClean(state);
    const profile = readUsualClean();
    expect(profile?.line1).toBe("100 Queen St W");
    expect(localStorage.getItem(USUAL_CLEAN_STORAGE_KEY)).toBeTruthy();

    const patch = usualCleanToBookingPatch(profile!);
    expect(patch.serviceType).toBe("standard");
    expect(patch.step).toBe(5);
  });

  it("stores guest recent addresses", () => {
    pushRecentGuestAddress({
      line1: "1 Main St",
      city: "Miami",
      state: "FL",
      postalCode: "33101",
      country: "US",
    });
    const recent = readRecentGuestAddresses();
    expect(recent[0]?.city).toBe("Miami");
    expect(localStorage.getItem(RECENT_ADDRESSES_STORAGE_KEY)).toBeTruthy();
  });
});
