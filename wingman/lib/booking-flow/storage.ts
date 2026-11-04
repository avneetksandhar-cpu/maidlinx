import type { NightBookingState } from "@/lib/booking-flow/types";

export const BOOKING_STATE_KEY = "wm_night_booking_v1";

export const emptyBookingState = (): NightBookingState => ({
  destination: null,
  when: null,
  date: null,
  experienceType: null,
  vibe: null,
  partySize: 4,
  budget: null,
  selectedMatch: null,
  matches: [],
  requestId: null,
  quoteId: null,
  confirmedOffer: null,
  paymentStatus: "idle",
});

export function loadBookingState(): NightBookingState {
  if (typeof window === "undefined") return emptyBookingState();
  try {
    const raw = window.sessionStorage.getItem(BOOKING_STATE_KEY);
    if (!raw) return emptyBookingState();
    const parsed = JSON.parse(raw) as Partial<NightBookingState>;
    return { ...emptyBookingState(), ...parsed, partySize: parsed.partySize || 4 };
  } catch {
    return emptyBookingState();
  }
}

export function saveBookingState(state: NightBookingState) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(BOOKING_STATE_KEY, JSON.stringify(state));
}

export function clearBookingState() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(BOOKING_STATE_KEY);
}
