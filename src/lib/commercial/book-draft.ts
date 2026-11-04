/**
 * Client-persisted commercial book draft for sequential
 * Property → Service → Frequency → Preferred time → Teams.
 * Never invents providers — teams load from real commercial_proposals / bookings.
 */

import type { CommercialFrequency, PropertyType } from "@/lib/commercial/types";

export const COMMERCIAL_PROPERTY_TYPE_OPTIONS: Array<{
  id: PropertyType;
  label: string;
  subtitle: string;
}> = [
  { id: "office", label: "Office", subtitle: "Office or coworking space" },
  { id: "retail", label: "Storefront / retail", subtitle: "Shop, boutique, or showroom" },
  { id: "medical", label: "Medical / clinic", subtitle: "Healthcare or dental suite" },
  { id: "industrial", label: "Industrial / warehouse", subtitle: "Light industrial space" },
  { id: "other", label: "Other commercial", subtitle: "Managed property or other site" },
];

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

export const COMMERCIAL_TIME_OPTIONS = [
  {
    id: "evening_6_8",
    label: "Evening (6:00–8:00 PM)",
    subtitle: "After typical office hours",
  },
  {
    id: "evening_6_30_8_30",
    label: "Evening (6:30–8:30 PM)",
    subtitle: "Later evening window",
  },
  {
    id: "morning_7_9",
    label: "Morning (7:00–9:00 AM)",
    subtitle: "Before the workday",
  },
  {
    id: "midday_11_1",
    label: "Midday (11:00 AM–1:00 PM)",
    subtitle: "During business hours",
  },
  {
    id: "flexible",
    label: "Flexible / crew proposes",
    subtitle: "Open to provider availability",
  },
] as const;

export type CommercialTimeId = (typeof COMMERCIAL_TIME_OPTIONS)[number]["id"];

export interface CommercialBookDraft {
  siteId: string | null;
  siteLabel: string | null;
  propertyType: PropertyType | null;
  serviceId: CommercialServiceId | null;
  serviceLabel: string | null;
  frequency: CommercialFrequency | null;
  preferredTimeId: CommercialTimeId | null;
  preferredTimeLabel: string | null;
  proposalId: string | null;
  line1: string | null;
  city: string | null;
  region: string | null;
  postalCode: string | null;
  country: string | null;
  marketId: string | null;
  googlePlaceId: string | null;
  updatedAt: string;
}

const STORAGE_KEY = "maidlinx.commercialBook.v1";

export function emptyCommercialBookDraft(): CommercialBookDraft {
  return {
    siteId: null,
    siteLabel: null,
    propertyType: null,
    serviceId: null,
    serviceLabel: null,
    frequency: null,
    preferredTimeId: null,
    preferredTimeLabel: null,
    proposalId: null,
    line1: null,
    city: null,
    region: null,
    postalCode: null,
    country: null,
    marketId: null,
    googlePlaceId: null,
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

/** Address or saved site + property type + service + frequency + preferred time. */
export function isCommercialBookReady(draft: CommercialBookDraft): boolean {
  const hasPlace = Boolean(
    draft.siteId ||
      (draft.propertyType && (draft.line1?.trim() || draft.postalCode?.trim())),
  );
  return Boolean(
    hasPlace &&
      draft.propertyType &&
      draft.serviceId &&
      draft.frequency &&
      draft.preferredTimeId,
  );
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

/** Notes blob for quote form when no crew is available. */
export function commercialDraftQuoteNotes(draft: CommercialBookDraft): string {
  return [
    draft.siteLabel ? `Property: ${draft.siteLabel}` : null,
    draft.line1
      ? `Address: ${[draft.line1, draft.city, draft.region, draft.postalCode].filter(Boolean).join(", ")}`
      : draft.postalCode
        ? `ZIP: ${draft.postalCode}`
        : null,
    draft.propertyType ? `Property type: ${draft.propertyType}` : null,
    draft.serviceLabel ? `Cleaning: ${draft.serviceLabel}` : null,
    draft.frequency ? `Frequency: ${frequencyShortLabel(draft.frequency)}` : null,
    draft.preferredTimeLabel ? `Preferred time: ${draft.preferredTimeLabel}` : null,
  ]
    .filter(Boolean)
    .join("\n");
}
