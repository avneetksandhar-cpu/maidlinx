/** B2B commercial domain types (South Florida FWR). */

export const COMMERCIAL_AREAS = [
  "restrooms",
  "floors",
  "breakroom",
  "common_areas",
] as const;

export type CommercialArea = (typeof COMMERCIAL_AREAS)[number];

export const SERVICE_DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
export type ServiceDay = (typeof SERVICE_DAYS)[number];

export type CommercialFrequency =
  | "one_time"
  | "weekly"
  | "biweekly"
  | "monthly"
  | "custom";

export type BillingCadence = "per_visit" | "monthly" | "net15" | "net30";

export type PropertyType = "office" | "medical" | "retail" | "industrial" | "other";

export type ProposalStatus =
  | "draft"
  | "sent"
  | "awaiting_approval"
  | "approved"
  | "rejected"
  | "superseded"
  | "withdrawn";

export type VisitItemResult = "completed" | "missed" | "not_applicable";

export type OpsCaseType =
  | "unfilled_visit"
  | "cancellation"
  | "missed_work"
  | "unpaid_invoice"
  | "payout_issue";

export interface BusinessAccount {
  id: string;
  name: string;
  ownerUserId: string;
  status: string;
}

export interface CommercialSiteScope {
  id: string;
  siteAddressId: string;
  businessAccountId: string;
  areas: CommercialArea[];
  frequency: CommercialFrequency;
  serviceDays: ServiceDay[];
  serviceWindow: string | null;
  startDate: string | null;
  squareFootage: number | null;
  siteContact: string | null;
  /** Only returned to authorized buyer/admin/assigned provider. */
  accessNotes: string | null;
  summaryPlain: string;
  version: number;
  updatedAt: string;
}

export interface CommercialProposal {
  id: string;
  businessAccountId: string;
  siteAddressId: string;
  scopeId: string | null;
  providerCleanerId: string | null;
  providerUserId: string | null;
  providerName: string | null;
  status: ProposalStatus;
  inclusions: string | null;
  exclusions: string | null;
  clientPriceCents: number;
  providerPayoutCents: number;
  frequency: CommercialFrequency;
  billingCadence: BillingCadence;
  firstVisitDate: string | null;
  dueNowCents: number;
  paymentExpected: string;
  scopeSnapshot: Record<string, unknown>;
  walkthroughRequested: boolean;
  approvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceOrder {
  id: string;
  proposalId: string;
  businessAccountId: string;
  siteAddressId: string;
  providerCleanerId: string | null;
  crewLeadUserId: string | null;
  status: "active" | "paused" | "cancelled" | "completed";
  clientPriceCents: number;
  providerPayoutCents: number;
  variableCostCents: number;
  frequency: string;
  billingCadence: string;
  scopeSnapshot: Record<string, unknown>;
  agreedChecklist: Array<{ id: string; label: string }>;
  nextVisitAt: string | null;
  cancelReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface VisitReportItem {
  id: string;
  bookingId: string;
  checklistItemId: string;
  label: string;
  result: VisitItemResult;
  missReason: string | null;
}

export interface CommercialOpsCase {
  id: string;
  caseType: OpsCaseType;
  status: "open" | "in_progress" | "resolved";
  businessAccountId: string | null;
  serviceOrderId: string | null;
  bookingId: string | null;
  followUpOwnerUserId: string | null;
  summary: string;
  resolutionNotes: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CommercialProviderProfile {
  cleanerId: string;
  serviceArea: string | null;
  specialties: string[];
  availableHours: string | null;
  onboardingComplete: boolean;
  /** Verification is separate from availability — never conflate. */
  isVerified: boolean;
  isActive: boolean;
}

export function areaLabel(area: string): string {
  switch (area) {
    case "restrooms":
      return "Restrooms";
    case "floors":
      return "Floors";
    case "breakroom":
      return "Breakroom / kitchen";
    case "common_areas":
      return "Common areas";
    default:
      return area.replaceAll("_", " ");
  }
}

export function frequencyLabel(freq: string): string {
  switch (freq) {
    case "one_time":
      return "One-time visit";
    case "weekly":
      return "Recurring weekly";
    case "biweekly":
      return "Every 2 weeks";
    case "monthly":
      return "Monthly";
    case "custom":
      return "Custom cadence";
    default:
      return freq;
  }
}

export function dayLabel(day: string): string {
  const map: Record<string, string> = {
    mon: "Mon",
    tue: "Tue",
    wed: "Wed",
    thu: "Thu",
    fri: "Fri",
    sat: "Sat",
    sun: "Sun",
  };
  return map[day] ?? day;
}

export function buildScopeSummary(input: {
  areas: string[];
  frequency: string;
  serviceDays: string[];
  serviceWindow: string | null;
  squareFootage: number | null;
}): string {
  const areaBits = input.areas.map(areaLabel).join(", ") || "Areas TBD";
  const days =
    input.serviceDays.length > 0
      ? input.serviceDays.map(dayLabel).join(", ")
      : "Days TBD";
  const window = input.serviceWindow?.trim() || "Window TBD";
  const sq = input.squareFootage ? `${input.squareFootage.toLocaleString()} sq ft` : null;
  return [frequencyLabel(input.frequency), days, window, areaBits, sq]
    .filter(Boolean)
    .join(" · ");
}

/** Contribution = client price − provider payout − recorded variable costs (estimate label). */
export function contributionMarginCents(input: {
  clientPriceCents: number;
  providerPayoutCents: number;
  variableCostCents: number;
}): number {
  return (
    input.clientPriceCents - input.providerPayoutCents - input.variableCostCents
  );
}

export function checklistFromAreas(areas: string[]): Array<{ id: string; label: string }> {
  const selected = areas.length > 0 ? areas : [...COMMERCIAL_AREAS];
  return selected.map((id) => ({ id, label: areaLabel(id) }));
}
