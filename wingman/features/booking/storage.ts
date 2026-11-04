const DRAFT_KEY = "wingman-booking-draft";
const BOOKINGS_KEY = "wingman-bookings";
const PLAN_KEY = "wingman-evening-plan";
const ACTIVE_REF_KEY = "wingman-active-booking-ref";

export type BookingSource = "experience" | "promoter" | "plan";

export type BookingStatus =
  | "request_received"
  | "availability_confirmed"
  | "confirmed";

export type EveningOccasion =
  | "dinner"
  | "night_out"
  | "celebration"
  | "visiting"
  | "quiet";

export type EveningTaste = "dining" | "music" | "fashion" | "social" | "water";

export type EveningBudget = "flexible" | "moderate" | "special";

export type EveningPlan = {
  date: string;
  occasion: EveningOccasion;
  guests: number;
  tastes: EveningTaste[];
  budget: EveningBudget;
};

export type BookingDraft = {
  source: BookingSource;
  experienceId?: string;
  promoterId?: string;
  guests: number;
  specialRequests: string;
  plan?: EveningPlan;
};

export type StoredBooking = {
  id: string;
  ref: string;
  experienceId?: string;
  promoterId?: string;
  title: string;
  venue: string;
  dateLabel: string;
  timeLabel: string;
  guests: number;
  subtotal: number;
  serviceFee: number;
  total: number;
  createdAt: string;
  status: BookingStatus;
  arrivalNote?: string;
  contactName?: string;
  contactDetail?: string;
  source: BookingSource;
};

export const DEFAULT_BOOKING_REF = "WM-7XKD92";

export const BOOKING_STATUS_COPY: Record<
  BookingStatus,
  { label: string; isReservation: boolean; short: string }
> = {
  request_received: {
    label: "Request received",
    isReservation: false,
    short: "A request — not a reservation",
  },
  availability_confirmed: {
    label: "Availability confirmed",
    isReservation: false,
    short: "Available — not secured until you pay",
  },
  confirmed: {
    label: "Booking confirmed",
    isReservation: true,
    short: "Confirmed reservation",
  },
};

export function createBookingRef() {
  const suffix = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `WM-${suffix}`;
}

export function getServiceFee(subtotal: number) {
  return Math.round(subtotal * 0.2);
}

function readJson<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function loadDraft(): BookingDraft | null {
  return readJson<BookingDraft>(DRAFT_KEY);
}

export function saveDraft(draft: BookingDraft) {
  sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
}

export function loadEveningPlan(): EveningPlan | null {
  return readJson<EveningPlan>(PLAN_KEY);
}

export function saveEveningPlan(plan: EveningPlan) {
  sessionStorage.setItem(PLAN_KEY, JSON.stringify(plan));
}

export function loadBookings(): StoredBooking[] {
  return readJson<StoredBooking[]>(BOOKINGS_KEY) ?? [];
}

export function saveBooking(booking: StoredBooking) {
  const next = [booking, ...loadBookings().filter((item) => item.ref !== booking.ref)];
  sessionStorage.setItem(BOOKINGS_KEY, JSON.stringify(next));
  sessionStorage.setItem(ACTIVE_REF_KEY, booking.ref);
}

export function getBookingByRef(ref: string) {
  return loadBookings().find((item) => item.ref === ref);
}

export function getActiveBookingRef() {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(ACTIVE_REF_KEY);
}

export function getLatestBooking(): StoredBooking | undefined {
  return loadBookings()[0];
}

export function getLatestConfirmed(): StoredBooking | undefined {
  return loadBookings().find((item) => item.status === "confirmed");
}

export function getOpenBooking(): StoredBooking | undefined {
  return loadBookings().find((item) => item.status !== "confirmed");
}

export function defaultEveningPlan(): EveningPlan {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return {
    date: date.toISOString().slice(0, 10),
    occasion: "dinner",
    guests: 2,
    tastes: ["dining"],
    budget: "flexible",
  };
}

export function formatPlanDate(isoDate: string) {
  const parsed = new Date(`${isoDate}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return isoDate;
  return parsed.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export const OCCASION_LABELS: Record<EveningOccasion, string> = {
  dinner: "Dinner",
  night_out: "A night out",
  celebration: "A celebration",
  visiting: "Visiting Miami",
  quiet: "Something quieter",
};

export const TASTE_LABELS: Record<EveningTaste, string> = {
  dining: "Dining",
  music: "Music",
  fashion: "Fashion",
  social: "Social",
  water: "On the water",
};

export const BUDGET_LABELS: Record<EveningBudget, string> = {
  flexible: "Flexible",
  moderate: "Moderate",
  special: "A special night",
};
