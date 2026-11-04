/**
 * Client-persisted commercial book draft for sequential Property → Service → Frequency.
 * Never invents providers — teams load from real commercial_proposals / bookings.
 */

import type { CommercialFrequency } from "@/lib/commercial/types";

export const COMMERCIAL_SERVICE_OPTIONS = [
  {
    id: "after_hours_office",
    label: "After-hours office clean",
    subtitle: "Evening window after staff leave",
    operatingSchedule: "after_hours",
  },
  {
    id: "business_hours_office",
    label: "Business-hours office clean",
    subtitle: "During the workday",
    operatingSchedule: "business_hours",
  },
  {
    id: "weekend_office",
    label: "Weekend office clean",
    subtitle: "Saturday or Sunday visit",
    operatingSchedule: "weekends",
  },
  {
    id: "flexible_office",
    label: "Flexible office clean",
    subtitle: "Crew proposes an open window",
    operatingSchedule: "flexible",
  },
] as const;

export type CommercialServiceId = (typeof COMMERCIAL_SERVICE_OPTIONS)[number]["id"];

export const COMMERCIAL_FREQUENCY_OPTIONS: Array<{
  id: CommercialFrequency;
  label: string;
  subtitle: string;
}> = [
  { id: "one_time", label: "One-time", subtitle: "Single commercial visit" },
  { id: "weekly", label: "Weekly", subtitle: "Same day each week" },
  { id: "biweekly", label: "Every 2 weeks", subtitle: "Biweekly cadence" },
  { id: "monthly", label: "Monthly", subtitle: "Once per month" },
];

export interface CommercialBookDraft {
  siteId: string | null;
  siteLabel: string | null;
  serviceId: CommercialServiceId | null;
  serviceLabel: string | null;
  frequency: CommercialFrequency | null;
  proposalId: string | null;
  updatedAt: string;
}

const STORAGE_KEY = "maidlinx.commercialBook.v1";

export function emptyCommercialBookDraft(): CommercialBookDraft {
  return {
    siteId: null,
    siteLabel: null,
    serviceId: null,
    serviceLabel: null,
    frequency: null,
    proposalId: null,
    updatedAt: new Date().toISOString(),
  };
}

export function readCommercialBookDraft(): CommercialBookDraft {
  if (typeof window === "undefined") return emptyCommercialBookDraft();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyCommercialBookDraft();
    const parsed = JSON.parse(raw) as Partial<CommercialBookDraft>;
    return { ...emptyCommercialBookDraft(), ...parsed };
  } catch {
    return emptyCommercialBookDraft();
  }
}

export function writeCommercialBookDraft(
  patch: Partial<CommercialBookDraft>,
): CommercialBookDraft {
  const next: CommercialBookDraft = {
    ...readCommercialBookDraft(),
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }
  return next;
}

export function isCommercialBookReady(draft: CommercialBookDraft): boolean {
  return Boolean(draft.siteId && draft.serviceId && draft.frequency);
}

export function serviceLabelForId(id: string | null): string | null {
  if (!id) return null;
  return COMMERCIAL_SERVICE_OPTIONS.find((o) => o.id === id)?.label ?? null;
}

export function frequencyShortLabel(freq: CommercialFrequency | null): string {
  switch (freq) {
    case "one_time":
      return "One-time";
    case "weekly":
      return "Weekly";
    case "biweekly":
      return "Every 2 weeks";
    case "monthly":
      return "Monthly";
    case "custom":
      return "Custom";
    default:
      return "Select";
  }
}
