/**
 * Load gate config + cleaner snapshot; enforce before real jobs.
 */

import { createAdminClient, hasAdminEnv } from "@/lib/supabase/admin";
import {
  DEFAULT_GATES,
  evaluateApprovalGates,
  gateFailureMessage,
  type CleanerGateSnapshot,
  type GateCheckResult,
  type GateDefinition,
  type GateKey,
} from "@/lib/cleaners/gates";
import { snapshotFromProfessionalRow } from "@/lib/cleaners/trust";
import { parseOnboardingStatus } from "@/lib/cleaners/onboarding";
import type { Database } from "@/types/database.types";

const GATE_SELECT =
  "id, onboarding_status, is_active, identity_status, background_status, phone_verified_at, email_verified_at, agreements_accepted_at, training_completed_at, assessment_passed_at, maidlinx_verified, platform_stage, requires_admin_review";

export async function loadGateDefinitions(): Promise<GateDefinition[]> {
  if (!hasAdminEnv()) return DEFAULT_GATES;
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("cleaner_approval_gates")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error || !data?.length) {
    return DEFAULT_GATES;
  }

  return data.map((row) => {
    const r = row as Record<string, unknown>;
    return {
      gateKey: String(r.gate_key) as GateKey,
      label: String(r.label),
      description: r.description ? String(r.description) : undefined,
      required: Boolean(r.required),
      enabled: Boolean(r.enabled),
      sortOrder: Number(r.sort_order),
    };
  });
}

export async function loadCleanerGateSnapshot(
  professionalId: string,
): Promise<CleanerGateSnapshot | null> {
  if (!hasAdminEnv()) return null;
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("professionals")
    .select(GATE_SELECT)
    .eq("id", professionalId)
    .maybeSingle();

  if (error) {
    // Migration may not be applied yet — fall back to legacy fields only.
    if (
      error.message.includes("identity_status") ||
      error.message.includes("does not exist")
    ) {
      const { data: legacy } = await supabase
        .from("professionals")
        .select("id, onboarding_status, is_active, agreements_accepted_at, is_verified")
        .eq("id", professionalId)
        .maybeSingle();
      if (!legacy) return null;
      const r = legacy as Record<string, unknown>;
      const approved = parseOnboardingStatus(r.onboarding_status) === "APPROVED";
      return {
        identityStatus: approved ? "verified" : "PENDING_PROVIDER",
        backgroundStatus: approved ? "clear" : "PENDING_PROVIDER",
        phoneVerified: approved,
        emailVerified: approved,
        agreementsAccepted: Boolean(r.agreements_accepted_at) || approved,
        trainingComplete: approved,
        assessmentPassed: approved,
        adminApproved: approved,
        isActive: Boolean(r.is_active),
      };
    }
    throw new Error(error.message);
  }
  if (!data) return null;
  return snapshotFromProfessionalRow(data as Record<string, unknown>);
}

export async function assertCleanerCanTakeJobs(
  professionalId: string,
): Promise<GateCheckResult> {
  const [snapshot, gates] = await Promise.all([
    loadCleanerGateSnapshot(professionalId),
    loadGateDefinitions(),
  ]);

  if (!snapshot) {
    return {
      allowed: false,
      failedGates: ["admin_approval", "active_status"],
      evaluations: [],
    };
  }

  return evaluateApprovalGates(snapshot, gates);
}

export async function requireCleanerCanTakeJobs(professionalId: string): Promise<void> {
  const result = await assertCleanerCanTakeJobs(professionalId);
  if (!result.allowed) {
    throw new Error(gateFailureMessage(result) || "Cleaner is not cleared for jobs.");
  }
}

export async function markContactVerified(input: {
  professionalId: string;
  phone?: boolean;
  email?: boolean;
}): Promise<void> {
  if (!hasAdminEnv()) return;
  const now = new Date().toISOString();
  const patch: Record<string, unknown> = {};
  if (input.phone) patch.phone_verified_at = now;
  if (input.email) patch.email_verified_at = now;
  if (Object.keys(patch).length === 0) return;
  const supabase = createAdminClient();
  await supabase
    .from("professionals")
    .update(patch as Database["public"]["Tables"]["professionals"]["Update"])
    .eq("id", input.professionalId);
}

/**
 * After admin approval + all gates, set maidlinx_verified + ACTIVE.
 * Never sets verified solely because providers are missing.
 */
export async function syncMaidlinxVerifiedFlag(professionalId: string): Promise<boolean> {
  if (!hasAdminEnv()) return false;
  const result = await assertCleanerCanTakeJobs(professionalId);
  const supabase = createAdminClient();
  const verified = result.allowed;
  await supabase
    .from("professionals")
    .update({
      maidlinx_verified: verified,
      verified_at: verified ? new Date().toISOString() : null,
      platform_stage: verified ? "ACTIVE" : undefined,
      is_verified: verified,
    })
    .eq("id", professionalId);
  return verified;
}
