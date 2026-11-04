export const INTEREST_SOURCES = [
  "wingmen_directory",
  "event",
  "home",
  "plan",
  "other",
  "wingman_apply",
] as const;
export type InterestSource = (typeof INTEREST_SOURCES)[number];

export const INTEREST_DISCLAIMER =
  "This does not charge you and does not promise a Wingman, a reservation, or access.";

export type InterestInput = {
  email: string;
  name?: string;
  source?: string;
  eventId?: string | null;
  notes?: string;
};

export function normalizeInterest(input: InterestInput): {
  email: string;
  name: string | null;
  source: InterestSource;
  eventId: string | null;
  notes: string | null;
} {
  const email = input.email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Enter a valid email address.");
  }

  const source = INTEREST_SOURCES.includes(input.source as InterestSource)
    ? (input.source as InterestSource)
    : "other";
  const name = (input.name ?? "").trim().slice(0, 120) || null;
  const notes = (input.notes ?? "").trim().slice(0, 500) || null;
  const eventId = input.eventId?.trim() || null;

  return { email, name, source, eventId, notes };
}
