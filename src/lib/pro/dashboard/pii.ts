import type { ProJob } from "@/lib/pro/dashboard/jobs";
import { ACTIVE_JOB_STATUSES } from "@/lib/bookings/status";

/**
 * Exact street address + customer contact are revealed only when this cleaner
 * owns the assignment (or the job is completed for that cleaner).
 */
export function canRevealExactAddress(
  job: Pick<ProJob, "status" | "professionalProfileId">,
  profileId: string,
): boolean {
  if (!job.professionalProfileId || job.professionalProfileId !== profileId) {
    return false;
  }
  return (
    ACTIVE_JOB_STATUSES.includes(job.status as (typeof ACTIVE_JOB_STATUSES)[number]) ||
    job.status === "completed"
  );
}

/** City / state / postal only — never street for marketplace listings. */
export function formatGeneralLocation(
  city: string | null,
  state: string | null,
  postalCode: string | null,
): string {
  const locality = [city, state].filter(Boolean).join(", ");
  const postal = postalCode?.trim() ? postalCode.trim() : null;
  return [locality, postal].filter(Boolean).join(" · ") || "Location available after accept";
}

/**
 * Strip customer PII and exact address from marketplace / unowned jobs.
 * Keeps city/state/postal for general location; drops street + lat/lng + contact.
 */
export function sanitizeAvailableJob(job: ProJob): ProJob {
  return {
    ...job,
    customerFirstName: null,
    customerLastName: null,
    customerPhone: null,
    notes: null,
    addressLine1: null,
    addressLine2: null,
    addressLatitude: null,
    addressLongitude: null,
    addressRevealed: false,
  };
}

export function assertJobOwnedByCleaner(
  job: { professionalProfileId: string | null } | null,
  profileId: string,
): asserts job is { professionalProfileId: string } {
  if (!job || job.professionalProfileId !== profileId) {
    throw new Error("You do not have access to this job.");
  }
}
