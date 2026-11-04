/**
 * Internal trust profile + truthful customer Verified messaging.
 * Never expose private screening details to customers.
 */

import { createAdminClient, hasAdminEnv } from "@/lib/supabase/admin";
import { canTakeRealJobs, type CleanerGateSnapshot } from "@/lib/cleaners/gates";
import {
  parseBackgroundStatus,
  parseIdentityStatus,
  parsePlatformStage,
  type PlatformStage,
} from "@/lib/cleaners/platform";
import { writeCleanerPlatformAudit } from "@/lib/cleaners/platform-audit";
import { publicCleanerDisplayName } from "@/lib/cleaners/onboarding";
import type { Database } from "@/types/database.types";

export interface TrustMetrics {
  trustScore: number;
  reliabilityScore: number;
  ratingAverage: number;
  ratingCount: number;
  completedJobs: number;
  cancellationRate: number;
  onTimeRate: number;
  seriousFlagCount: number;
  platformStage: PlatformStage;
  maidlinxVerified: boolean;
  requiresAdminReview: boolean;
}

export interface CustomerCleanerTrustCard {
  displayName: string;
  maidlinxVerified: boolean;
  badgeLabel: string | null;
  badgeExplanation: string | null;
  ratingAverage: number;
  ratingCount: number;
  completedJobs: number;
  /** Never includes screening vendor results or private notes. */
}

/** Truthful customer copy — no "background checked" claim until provider connected + clear. */
export function buildVerifiedBadgeMessaging(input: {
  maidlinxVerified: boolean;
  backgroundProviderConnected: boolean;
  backgroundStatus: string;
}): { badgeLabel: string | null; badgeExplanation: string | null } {
  if (!input.maidlinxVerified) {
    return { badgeLabel: null, badgeExplanation: null };
  }

  const screenedByProvider =
    input.backgroundProviderConnected && input.backgroundStatus === "clear";

  if (screenedByProvider) {
    return {
      badgeLabel: "MaidLinx Verified",
      badgeExplanation:
        "Identity confirmed, screened through MaidLinx’s screening partner, trained in MaidLinx Academy, and approved for jobs based on ratings and reliability.",
    };
  }

  return {
    badgeLabel: "MaidLinx Verified",
    badgeExplanation:
      "Identity reviewed, MaidLinx Academy trained, and ops-approved for jobs based on ratings and reliability. Third-party background screening partner is pending connection — we do not claim vendor background checks until that is live.",
  };
}

export function computeTrustScores(input: {
  ratingAverage: number;
  ratingCount: number;
  completedJobs: number;
  cancellationRate: number;
  onTimeRate: number;
  seriousFlagCount: number;
}): { trustScore: number; reliabilityScore: number; tier: "ACTIVE" | "TRUSTED" | "ELITE" | null } {
  const ratingWeight =
    input.ratingCount === 0 ? 50 : Math.min(100, (input.ratingAverage / 5) * 100);
  const volumeBoost = Math.min(20, input.completedJobs * 0.5);
  const cancelPenalty = Math.min(40, input.cancellationRate * 100);
  const onTime = Math.min(100, Math.max(0, input.onTimeRate * 100));
  const flagPenalty = Math.min(50, input.seriousFlagCount * 15);

  const reliabilityScore = Math.round(
    Math.max(0, Math.min(100, onTime * 0.6 + (100 - cancelPenalty) * 0.4 - flagPenalty * 0.2)),
  );
  const trustScore = Math.round(
    Math.max(
      0,
      Math.min(100, ratingWeight * 0.45 + reliabilityScore * 0.4 + volumeBoost - flagPenalty),
    ),
  );

  let tier: "ACTIVE" | "TRUSTED" | "ELITE" | null = null;
  if (input.completedJobs >= 50 && trustScore >= 90 && input.seriousFlagCount === 0) {
    tier = "ELITE";
  } else if (input.completedJobs >= 15 && trustScore >= 80 && input.seriousFlagCount === 0) {
    tier = "TRUSTED";
  } else if (input.completedJobs > 0) {
    tier = "ACTIVE";
  }

  return { trustScore, reliabilityScore, tier };
}

export async function getTrustMetrics(professionalId: string): Promise<TrustMetrics | null> {
  if (!hasAdminEnv()) return null;
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("professionals")
    .select(
      "trust_score, reliability_score, rating_average, rating_count, serious_flag_count, platform_stage, maidlinx_verified, requires_admin_review",
    )
    .eq("id", professionalId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;
  const r = data as Record<string, unknown>;

  // Operational rates live on cleaners base table (not always on professionals view).
  const { data: rates } = await supabase
    .from("cleaners")
    .select("cancellation_rate, on_time_rate, completed_jobs")
    .eq("id", professionalId)
    .maybeSingle();
  const rateRow = (rates ?? {}) as Record<string, unknown>;

  return {
    trustScore: Number(r.trust_score ?? 0),
    reliabilityScore: Number(r.reliability_score ?? 0),
    ratingAverage: Number(r.rating_average ?? 0),
    ratingCount: Number(r.rating_count ?? 0),
    completedJobs: Number(rateRow.completed_jobs ?? 0),
    cancellationRate: Number(rateRow.cancellation_rate ?? 0),
    onTimeRate: Number(rateRow.on_time_rate ?? 0),
    seriousFlagCount: Number(r.serious_flag_count ?? 0),
    platformStage: parsePlatformStage(r.platform_stage),
    maidlinxVerified: Boolean(r.maidlinx_verified),
    requiresAdminReview: Boolean(r.requires_admin_review),
  };
}

export async function refreshTrustMetrics(professionalId: string): Promise<TrustMetrics | null> {
  if (!hasAdminEnv()) return null;
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("professionals")
    .select(
      "rating_average, rating_count, serious_flag_count, is_active, onboarding_status",
    )
    .eq("id", professionalId)
    .maybeSingle();

  if (error || !data) return getTrustMetrics(professionalId);
  const r = data as unknown as Record<string, unknown>;
  const { data: rates } = await supabase
    .from("cleaners")
    .select("cancellation_rate, on_time_rate, completed_jobs")
    .eq("id", professionalId)
    .maybeSingle();
  const rateRow = (rates ?? {}) as Record<string, unknown>;
  const scores = computeTrustScores({
    ratingAverage: Number(r.rating_average ?? 0),
    ratingCount: Number(r.rating_count ?? 0),
    completedJobs: Number(rateRow.completed_jobs ?? 0),
    cancellationRate: Number(rateRow.cancellation_rate ?? 0),
    onTimeRate: Number(rateRow.on_time_rate ?? 0),
    seriousFlagCount: Number(r.serious_flag_count ?? 0),
  });

  const patch: Record<string, unknown> = {
    trust_score: scores.trustScore,
    reliability_score: scores.reliabilityScore,
  };
  if (scores.tier === "ELITE" || scores.tier === "TRUSTED") {
    patch.platform_stage = scores.tier;
  }

  await supabase
    .from("professionals")
    .update(patch as Database["public"]["Tables"]["professionals"]["Update"])
    .eq("id", professionalId);
  return getTrustMetrics(professionalId);
}

/**
 * Serious flags always go to admin review — never auto-fire / auto-suspend.
 */
export async function raiseTrustFlag(input: {
  cleanerId: string;
  flagType:
    | "no_show"
    | "late"
    | "quality"
    | "customer_complaint"
    | "safety"
    | "policy"
    | "fraud_signal"
    | "other";
  severity: "low" | "medium" | "high" | "critical";
  notes?: string | null;
  createdBy?: string | null;
}): Promise<void> {
  if (!hasAdminEnv()) throw new Error("Database not configured.");
  const supabase = createAdminClient();
  const serious = input.severity === "high" || input.severity === "critical";

  const { error } = await supabase.from("cleaner_trust_flags").insert({
    cleaner_id: input.cleanerId,
    flag_type: input.flagType,
    severity: input.severity,
    status: serious ? "under_review" : "open",
    notes: input.notes ?? null,
    created_by: input.createdBy ?? null,
  });
  if (error) throw new Error(error.message);

  if (serious) {
    await supabase
      .from("professionals")
      .update({
        requires_admin_review: true,
        serious_flag_count: undefined, // incremented below via RPC-less read/update
      })
      .eq("id", input.cleanerId);

    const { data: current } = await supabase
      .from("professionals")
      .select("serious_flag_count")
      .eq("id", input.cleanerId)
      .maybeSingle();
    const count = Number((current as Record<string, unknown> | null)?.serious_flag_count ?? 0);
    await supabase
      .from("professionals")
      .update({
        serious_flag_count: count + 1,
        requires_admin_review: true,
      })
      .eq("id", input.cleanerId);
  }

  await writeCleanerPlatformAudit({
    actorId: input.createdBy ?? null,
    actorRole: "system",
    action: "trust.flag_raised",
    cleanerId: input.cleanerId,
    metadata: {
      flagType: input.flagType,
      severity: input.severity,
      autoFire: false,
      adminReviewRequired: serious,
    },
  });
}

export function buildCustomerTrustCard(input: {
  firstName: string | null;
  lastName: string | null;
  maidlinxVerified: boolean;
  backgroundProviderConnected: boolean;
  backgroundStatus: string;
  ratingAverage: number;
  ratingCount: number;
  completedJobs: number;
}): CustomerCleanerTrustCard {
  const badge = buildVerifiedBadgeMessaging({
    maidlinxVerified: input.maidlinxVerified,
    backgroundProviderConnected: input.backgroundProviderConnected,
    backgroundStatus: input.backgroundStatus,
  });

  return {
    displayName: publicCleanerDisplayName(input.firstName, input.lastName),
    maidlinxVerified: input.maidlinxVerified,
    badgeLabel: badge.badgeLabel,
    badgeExplanation: badge.badgeExplanation,
    ratingAverage: input.ratingAverage,
    ratingCount: input.ratingCount,
    completedJobs: input.completedJobs,
  };
}

export function snapshotFromProfessionalRow(row: Record<string, unknown>): CleanerGateSnapshot {
  return {
    identityStatus: parseIdentityStatus(row.identity_status),
    backgroundStatus: parseBackgroundStatus(row.background_status),
    phoneVerified: Boolean(row.phone_verified_at),
    emailVerified: Boolean(row.email_verified_at),
    agreementsAccepted: Boolean(row.agreements_accepted_at),
    trainingComplete: Boolean(row.training_completed_at),
    assessmentPassed: Boolean(row.assessment_passed_at),
    adminApproved: String(row.onboarding_status) === "APPROVED",
    isActive: Boolean(row.is_active),
  };
}

export function isMaidlinxVerifiedEligible(snapshot: CleanerGateSnapshot): boolean {
  return canTakeRealJobs(snapshot);
}
