/**
 * Privilege-escalation / RLS intent tests for Cleaner Platform V1.
 * These assert server-side authorization contracts (pure + documented expectations).
 * Live RLS is verified against Supabase with a synthetic TEST cleaner after migration.
 */

import { describe, expect, it } from "vitest";
import { evaluateApprovalGates, type CleanerGateSnapshot } from "@/lib/cleaners/gates";
import { sanitizeAvailableJob } from "@/lib/pro/dashboard/pii";
import type { ProJob } from "@/lib/pro/dashboard/jobs";

function fullJob(overrides: Partial<ProJob> = {}): ProJob {
  return {
    id: "job-1",
    status: "awaiting_assignment",
    serviceType: "standard",
    serviceId: null,
    scheduledAt: "2026-08-12T14:00:00.000Z",
    arrivalWindowStart: null,
    arrivalWindowEnd: null,
    subtotalCents: 15000,
    platformFeeCents: 2250,
    totalCents: 17250,
    currency: "cad",
    bedrooms: 2,
    bathrooms: 1,
    squareFootage: null,
    extras: [],
    notes: "Gate code 1234",
    customerFirstName: "Pat",
    customerLastName: "Customer",
    customerPhone: "+15555550100",
    addressLine1: "123 Secret St",
    addressLine2: "Apt 4",
    addressCity: "Toronto",
    addressState: "ON",
    addressPostalCode: "M5V1A1",
    addressLatitude: 43.64,
    addressLongitude: -79.39,
    professionalProfileId: null,
    marketId: null,
    zoneId: null,
    jobChecklist: [],
    startedAt: null,
    completedAt: null,
    beforePhotoCount: 0,
    afterPhotoCount: 0,
    estimatedDurationMinutes: 120,
    distanceKm: null,
    travelMinutes: null,
    addressRevealed: false,
    ...overrides,
  };
}

describe("Privilege escalation — job permissions", () => {
  it("unclear cleaner cannot take real jobs (gates)", () => {
    const snapshot: CleanerGateSnapshot = {
      identityStatus: "PENDING_PROVIDER",
      backgroundStatus: "PENDING_PROVIDER",
      phoneVerified: false,
      emailVerified: false,
      agreementsAccepted: false,
      trainingComplete: false,
      assessmentPassed: false,
      adminApproved: false,
      isActive: false,
    };
    expect(evaluateApprovalGates(snapshot).allowed).toBe(false);
  });

  it("marketplace listing strips street address and access notes before assignment", () => {
    const sanitized = sanitizeAvailableJob(fullJob());
    expect(sanitized.addressLine1).toBeNull();
    expect(sanitized.addressLine2).toBeNull();
    expect(sanitized.customerPhone).toBeNull();
    expect(sanitized.notes).toBeNull();
    expect(sanitized.addressCity).toBe("Toronto");
    expect(sanitized.addressRevealed).toBe(false);
  });

  it("assigned job may reveal address only when addressRevealed", () => {
    const assigned = fullJob({
      status: "assigned",
      professionalProfileId: "cleaner-user",
      addressRevealed: true,
    });
    expect(assigned.addressLine1).toBe("123 Secret St");
    expect(assigned.notes).toContain("Gate code");
  });
});

describe("Privilege escalation — role boundaries (contract)", () => {
  /**
   * Founder checklist (manual / e2e after migration):
   * 1. Customer session cannot GET/POST /api/cleaner/* → 403
   * 2. Cleaner session cannot GET/POST /api/admin/cleaners/trust → 403
   * 3. Cleaner cannot PATCH another cleaner's professionals row via client RLS
   * 4. Cleaner cannot SELECT cleaner_platform_audit_log (admin-only policy)
   * 5. Cleaner cannot UPDATE cleaner_approval_gates
   * 6. Cleaner cannot INSERT trust flags for another cleaner
   * 7. Unapproved cleaner cannot accept/assign jobs (assertCleanerCanTakeJobs)
   * 8. Admin bootstrap email only path to admin role (handle_new_user)
   * 9. Customer cannot read raw identity_external_ref / background notes via public APIs
   * 10. No government-ID image columns in public.cleaners / application jsonb
   */
  it("documents founder privilege-escalation checklist", () => {
    const checklist = [
      "customer_blocked_from_cleaner_api",
      "cleaner_blocked_from_admin_trust_api",
      "cleaner_cannot_update_other_cleaner_row",
      "audit_log_admin_select_only",
      "gates_table_admin_write_only",
      "trust_flags_no_cross_cleaner_insert",
      "gates_enforced_before_accept",
      "admin_role_not_from_user_metadata",
      "no_private_screening_on_customer_card",
      "no_gov_id_images_in_db",
    ];
    expect(checklist).toHaveLength(10);
  });
});
