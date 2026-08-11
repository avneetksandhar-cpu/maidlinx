"use client";

import { startTransition, useCallback, useEffect, useState } from "react";
import {
  BOOKING_STATE_STORAGE_KEY,
  DEFAULT_BOOKING_STATE,
  PROPERTY_TYPES,
  type BookingState,
  type PropertyTypeId,
} from "@/lib/bookings/booking-state";
import { BOOKING_SERVICES } from "@/lib/bookings/constants";

function persistBookingState(state: BookingState) {
  if (typeof window === "undefined") return;
  try {
    // Never persist payment secrets — booking state is non-sensitive draft only.
    const { quote: _quote, ...safe } = state;
    void _quote;
    sessionStorage.setItem(BOOKING_STATE_STORAGE_KEY, JSON.stringify(safe));
  } catch {
    // Ignore quota / private mode failures.
  }
}

function readStoredState(): BookingState {
  if (typeof window === "undefined") return DEFAULT_BOOKING_STATE;

  try {
    const raw = sessionStorage.getItem(BOOKING_STATE_STORAGE_KEY);
    if (!raw) return DEFAULT_BOOKING_STATE;
    return { ...DEFAULT_BOOKING_STATE, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_BOOKING_STATE;
  }
}

function readPrefillFromUrl(): Partial<BookingState> | null {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  if (params.get("rebook") !== "1" && !params.get("line1") && !params.get("q")) return null;

  const serviceTypeParam = params.get("serviceType") ?? params.get("service") ?? undefined;
  const serviceType = BOOKING_SERVICES.some((s) => s.id === serviceTypeParam)
    ? (serviceTypeParam as BookingState["serviceType"])
    : undefined;
  const propertyTypeParam = params.get("propertyType") ?? undefined;
  const normalizedProperty =
    propertyTypeParam === "condo" ? "apartment" : propertyTypeParam;
  const propertyType = PROPERTY_TYPES.some((p) => p.id === normalizedProperty)
    ? (normalizedProperty as PropertyTypeId)
    : undefined;

  const q = params.get("q")?.trim();
  const isRebook = params.get("rebook") === "1";
  const bedrooms = params.get("bedrooms");
  const bathrooms = params.get("bathrooms");
  const squareFootage = params.get("squareFootage");
  const extrasRaw = params.get("extras");
  const extras = extrasRaw
    ? extrasRaw.split(",").map((e) => e.trim()).filter(Boolean)
    : undefined;

  return {
    line1: params.get("line1") ?? (q || undefined),
    line2: params.get("line2") ?? undefined,
    city: params.get("city") ?? undefined,
    state: params.get("state") ?? undefined,
    postalCode: params.get("postalCode") ?? undefined,
    country: params.get("country") ?? undefined,
    serviceType,
    propertyType,
    bedrooms: bedrooms != null ? Number(bedrooms) : undefined,
    bathrooms: bathrooms != null ? Number(bathrooms) : undefined,
    squareFootage: squareFootage != null ? Number(squareFootage) : undefined,
    extras: extras as BookingState["extras"],
    preferredCleanerId: params.get("preferredCleanerId") ?? undefined,
    preferredCleanerName: params.get("preferredCleanerName") ?? undefined,
    rebookSourceBookingId: params.get("sourceBookingId") ?? undefined,
    // Always create a NEW booking — clear schedule + prior booking id.
    date: undefined,
    arrivalWindow: undefined,
    schedulePreset: undefined,
    bookingId: undefined,
    quote: null,
    step: isRebook ? 6 : 1,
  };
}

export function useBookingState() {
  const [state, setState] = useState<BookingState>(DEFAULT_BOOKING_STATE);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // Hydrate draft from sessionStorage + optional rebook query params (client-only).
    const stored = readStoredState();
    const prefill = readPrefillFromUrl();
    startTransition(() => {
      const next = prefill ? { ...stored, ...prefill } : stored;
      setState(next);
      persistBookingState(next);
      setHydrated(true);
    });
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    persistBookingState(state);
  }, [state, hydrated]);

  const updateState = useCallback((value: Partial<BookingState>) => {
    setState((prev) => {
      const next = { ...prev, ...value };
      // Synchronous persist so soft navigations / deep-links see the draft immediately.
      persistBookingState(next);
      return next;
    });
  }, []);

  const resetState = useCallback(() => {
    setState(DEFAULT_BOOKING_STATE);
    if (typeof window !== "undefined") {
      sessionStorage.removeItem(BOOKING_STATE_STORAGE_KEY);
    }
  }, []);

  return { state, updateState, resetState, hydrated };
}
