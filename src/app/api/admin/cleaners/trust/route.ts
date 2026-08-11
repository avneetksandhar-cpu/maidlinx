import { jsonError, jsonSuccess } from "@/lib/api/response";
import { requireAdminApiPermission } from "@/lib/admin/session";
import { writeAuditLog } from "@/lib/admin/audit";
import {
  adminReviewVerification,
  getProviderConnectionState,
} from "@/lib/cleaners/verification";
import {
  assertCleanerCanTakeJobs,
  loadGateDefinitions,
  syncMaidlinxVerifiedFlag,
} from "@/lib/cleaners/gates-store";
import { listCleanerPlatformAudit } from "@/lib/cleaners/platform-audit";
import { raiseTrustFlag, refreshTrustMetrics } from "@/lib/cleaners/trust";
import { createAdminClient, hasAdminEnv } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  try {
    await requireAdminApiPermission("cleaners.read");
    if (!hasAdminEnv()) {
      return jsonSuccess({
        cleaners: [],
        audit: [],
        gates: [],
        providers: getProviderConnectionState(),
      });
    }

    const url = new URL(request.url);
    const reviewOnly = url.searchParams.get("review") === "1";
    const supabase = createAdminClient();

    let query = supabase
      .from("professionals")
      .select(
        `
        id,
        profile_id,
        onboarding_status,
        is_active,
        is_verified,
        platform_stage,
        identity_status,
        background_status,
        phone_verified_at,
        email_verified_at,
        training_completed_at,
        assessment_passed_at,
        agreements_accepted_at,
        maidlinx_verified,
        requires_admin_review,
        trust_score,
        reliability_score,
        serious_flag_count,
        rating_average,
        rating_count,
        rejection_reason,
        profile:profiles!professionals_profile_id_fkey (first_name, last_name, phone)
      `,
      )
      .order("updated_at", { ascending: false })
      .limit(200);

    if (reviewOnly) {
      query = query.eq("requires_admin_review", true);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    const [gates, audit] = await Promise.all([
      loadGateDefinitions(),
      listCleanerPlatformAudit(80),
    ]);

    const cleaners = await Promise.all(
      (data ?? []).map(async (row) => {
        const r = row as Record<string, unknown>;
        const gateCheck = await assertCleanerCanTakeJobs(String(r.id));
        const profile = r.profile as Record<string, unknown> | null;
        return {
          professionalId: String(r.id),
          profileId: String(r.profile_id),
          firstName: profile?.first_name ? String(profile.first_name) : null,
          lastName: profile?.last_name ? String(profile.last_name) : null,
          phone: profile?.phone ? String(profile.phone) : null,
          onboardingStatus: String(r.onboarding_status),
          platformStage: String(r.platform_stage ?? "APPLICANT"),
          identityStatus: String(r.identity_status ?? "PENDING_PROVIDER"),
          backgroundStatus: String(r.background_status ?? "PENDING_PROVIDER"),
          isActive: Boolean(r.is_active),
          maidlinxVerified: Boolean(r.maidlinx_verified),
          requiresAdminReview: Boolean(r.requires_admin_review),
          trustScore: Number(r.trust_score ?? 0),
          reliabilityScore: Number(r.reliability_score ?? 0),
          seriousFlagCount: Number(r.serious_flag_count ?? 0),
          ratingAverage: Number(r.rating_average ?? 0),
          ratingCount: Number(r.rating_count ?? 0),
          rejectionReason: r.rejection_reason ? String(r.rejection_reason) : null,
          gates: gateCheck,
        };
      }),
    );

    return jsonSuccess({
      cleaners,
      audit,
      gates,
      providers: getProviderConnectionState(),
    });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Forbidden.", 403);
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdminApiPermission("cleaners.write");
    const body = await request.json();
    const action = String(body?.action ?? "");
    const professionalId = String(body?.professionalId ?? "");

    if (!professionalId) {
      return jsonError("professionalId required.", 400);
    }

    if (action === "review_identity" || action === "review_background") {
      const decision = body?.decision as "clear" | "reject" | "manual_review";
      if (!decision) return jsonError("decision required.", 400);
      const state = await adminReviewVerification({
        professionalId,
        adminId: admin.id,
        target: action === "review_identity" ? "identity" : "background",
        decision,
        note: body?.note ? String(body.note) : null,
      });
      await writeAuditLog({
        adminProfileId: admin.id,
        action: `cleaner.${action}`,
        entityType: "professional",
        entityId: professionalId,
        metadata: { decision, note: body?.note ?? null },
      });
      return jsonSuccess(state);
    }

    if (action === "activate") {
      const cleared = await syncMaidlinxVerifiedFlag(professionalId);
      if (!cleared) {
        const gates = await assertCleanerCanTakeJobs(professionalId);
        return jsonError(
          `Cannot activate — gates incomplete: ${gates.failedGates.join(", ")}`,
          400,
        );
      }
      const supabase = createAdminClient();
      await supabase
        .from("professionals")
        .update({
          is_active: true,
          activated_at: new Date().toISOString(),
          platform_stage: "ACTIVE",
        })
        .eq("id", professionalId);
      await writeAuditLog({
        adminProfileId: admin.id,
        action: "cleaner.activate",
        entityType: "professional",
        entityId: professionalId,
      });
      return jsonSuccess({ activated: true });
    }

    if (action === "raise_flag") {
      await raiseTrustFlag({
        cleanerId: professionalId,
        flagType: body?.flagType ?? "other",
        severity: body?.severity ?? "medium",
        notes: body?.notes ?? null,
        createdBy: admin.id,
      });
      await writeAuditLog({
        adminProfileId: admin.id,
        action: "cleaner.trust_flag",
        entityType: "professional",
        entityId: professionalId,
        metadata: { flagType: body?.flagType, severity: body?.severity },
      });
      return jsonSuccess({ flagged: true });
    }

    if (action === "refresh_trust") {
      const metrics = await refreshTrustMetrics(professionalId);
      return jsonSuccess({ metrics });
    }

    return jsonError("Unknown action.", 400);
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Unable to update.", 400);
  }
}
