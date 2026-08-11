/**
 * Cleaner capability gate for marketplace job visibility / matching.
 * Use before scoring or listing available jobs.
 */

import { resolveCatalogService } from "@/lib/services/catalog";

export interface CleanerCapabilities {
  cleanerId: string;
  profileId?: string | null;
  approved: boolean;
  active: boolean;
  /** Marketplace service ids and/or legacy service_type values. */
  services: string[];
  /** Service zone ids. */
  serviceZones: string[];
  travelRadiusKm: number;
  qualifications: string[];
  yearsExperience?: number | null;
  rating?: number;
  completedJobs?: number;
  cancellationRate?: number;
  onTimeRate?: number;
}

export interface JobEligibilityTarget {
  serviceType?: string | null;
  serviceId?: string | null;
  marketId?: string | null;
  serviceZoneId?: string | null;
  zoneId?: string | null;
}

export type CleanerEligibilityReason =
  | "not_approved"
  | "inactive"
  | "service_not_offered"
  | "zone_not_covered"
  | "missing_qualification"
  | "insufficient_experience";

export interface CleanerEligibilityResult {
  eligible: boolean;
  reasons: CleanerEligibilityReason[];
}

export function checkCleanerJobEligibility(
  cleaner: CleanerCapabilities,
  job: JobEligibilityTarget,
): CleanerEligibilityResult {
  const reasons: CleanerEligibilityReason[] = [];

  if (!cleaner.active) reasons.push("inactive");
  if (!cleaner.approved) reasons.push("not_approved");

  const service = resolveCatalogService(job.serviceId ?? job.serviceType ?? "");
  const serviceKeys = new Set(
    [service?.id, service?.slug, service?.legacyServiceType, job.serviceType, job.serviceId].filter(
      Boolean,
    ) as string[],
  );

  if (cleaner.services.length > 0) {
    const offers = cleaner.services.some((s) => serviceKeys.has(s));
    if (!offers) reasons.push("service_not_offered");
  }

  const zoneId = job.serviceZoneId ?? job.zoneId ?? null;
  if (zoneId && cleaner.serviceZones.length > 0 && !cleaner.serviceZones.includes(zoneId)) {
    reasons.push("zone_not_covered");
  }

  // Enforce service-level requirements only once a cleaner has opted into capability rows.
  if (service && cleaner.services.length > 0) {
    const req = service.cleanerRequirements;
    if (req.requiresApproved && !cleaner.approved) {
      if (!reasons.includes("not_approved")) reasons.push("not_approved");
    }
    if (
      req.minYearsExperience > 0 &&
      (cleaner.yearsExperience ?? 0) < req.minYearsExperience
    ) {
      reasons.push("insufficient_experience");
    }
    if (req.qualifications.length > 0) {
      const held = new Set(cleaner.qualifications);
      if (req.qualifications.some((q) => !held.has(q))) {
        reasons.push("missing_qualification");
      }
    }
  }

  return { eligible: reasons.length === 0, reasons };
}

export function isCleanerEligibleForJob(
  cleaner: CleanerCapabilities,
  job: JobEligibilityTarget,
): boolean {
  return checkCleanerJobEligibility(cleaner, job).eligible;
}

export function filterJobsForCleaner<T extends JobEligibilityTarget>(
  cleaner: CleanerCapabilities,
  jobs: T[],
): T[] {
  return jobs.filter((job) => isCleanerEligibleForJob(cleaner, job));
}
