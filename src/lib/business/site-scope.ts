/**
 * Client-persisted commercial site scope (sq ft, restrooms, areas, cadence).
 * No invented providers — scope feeds Request quotes → owner_sales_leads.
 */

export type SiteScopeFrequency =
  | "one_time"
  | "weekly"
  | "biweekly"
  | "monthly"
  | "custom";

export interface SiteScope {
  siteId: string;
  squareFootage: string;
  restrooms: string;
  areas: string;
  /** e.g. Mon, Wed, Fri · After 6 PM */
  scheduleWindow: string;
  frequency: SiteScopeFrequency;
  siteContact: string;
  accessNotes: string;
  updatedAt: string;
}

const STORAGE_PREFIX = "maidlinx.siteScope.v1.";

export function emptySiteScope(siteId: string): SiteScope {
  return {
    siteId,
    squareFootage: "",
    restrooms: "",
    areas: "Floors & common areas",
    scheduleWindow: "",
    frequency: "weekly",
    siteContact: "",
    accessNotes: "",
    updatedAt: new Date().toISOString(),
  };
}

export function readSiteScope(siteId: string): SiteScope | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(`${STORAGE_PREFIX}${siteId}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<SiteScope>;
    if (!parsed || typeof parsed !== "object") return null;
    return {
      ...emptySiteScope(siteId),
      ...parsed,
      siteId,
    };
  } catch {
    return null;
  }
}

export function writeSiteScope(scope: SiteScope): void {
  if (typeof window === "undefined") return;
  const next: SiteScope = {
    ...scope,
    updatedAt: new Date().toISOString(),
  };
  window.localStorage.setItem(`${STORAGE_PREFIX}${scope.siteId}`, JSON.stringify(next));
}

export function scopeSummaryLine(scope: SiteScope | null): string {
  if (!scope) return "Scope not set yet";
  const bits = [
    scope.squareFootage.trim() ? `${scope.squareFootage.trim()} sq ft` : null,
    scope.restrooms.trim() ? `Restrooms · ${scope.restrooms.trim()}` : null,
    scope.areas.trim() || null,
    scope.scheduleWindow.trim() || null,
  ].filter(Boolean);
  return bits.length > 0 ? bits.join(" · ") : "Scope not set yet";
}

export function frequencyLabel(freq: SiteScopeFrequency): string {
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
      return "Custom cadence";
    default:
      return "Weekly";
  }
}

/** True when enough scope exists to request a sales quote. */
export function isScopeReadyForQuote(scope: SiteScope | null): boolean {
  if (!scope) return false;
  return Boolean(
    scope.squareFootage.trim() ||
      scope.areas.trim() ||
      scope.scheduleWindow.trim() ||
      scope.restrooms.trim(),
  );
}
