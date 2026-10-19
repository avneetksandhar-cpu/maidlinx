/**
 * Provider-agnostic identity + background verification layer.
 * Until legitimate providers are connected, statuses remain PENDING_PROVIDER
 * and require admin review. Never fabricate results or auto-approve.
 */

import { createAdminClient, hasAdminEnv } from "@/lib/supabase/admin";
import {
  backgroundProviderConnected,
  defaultBackgroundStatus,
  defaultIdentityStatus,
  identityProviderConnected,
  parseBackgroundStatus,
  parseIdentityStatus,
  type BackgroundStatus,
  type IdentityStatus,
} from "@/lib/cleaners/platform";
import { writeCleanerPlatformAudit } from "@/lib/cleaners/platform-audit";
import type { Database } from "@/types/database.types";

export interface VerificationState {
  identityStatus: IdentityStatus;
  identityProvider: string | null;
  identityExternalRef: string | null;
  identityReviewedAt: string | null;
  backgroundStatus: BackgroundStatus;
  backgroundProvider: string | null;
  backgroundExternalRef: string | null;
  backgroundReviewedAt: string | null;
  identityProviderConnected: boolean;
  backgroundProviderConnected: boolean;
  requiresAdminReview: boolean;
}

export function getProviderConnectionState() {
  return {
    identityProviderConnected: identityProviderConnected(),
    backgroundProviderConnected: backgroundProviderConnected(),
  };
}

/**
 * Cleaner starts identity verification.
 * If provider not connected → PENDING_PROVIDER + requires admin review.
 * Never sets verified automatically.
 */
export async function startIdentityVerification(input: {
  professionalId: string;
  actorId: string;
}): Promise<VerificationState> {
  if (!hasAdminEnv()) throw new Error("Database not configured.");

  const connected = identityProviderConnected();
  const status: IdentityStatus = connected ? "pending" : "PENDING_PROVIDER";
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("professionals")
    .update({
      identity_status: status,
      identity_provider: connected ? "configured" : null,
      platform_stage: "IDENTITY_PENDING",
      requires_admin_review: !connected || status === "PENDING_PROVIDER",
    })
    .eq("id", input.professionalId)
    .select(
      "identity_status, identity_provider, identity_external_ref, identity_reviewed_at, background_status, background_provider, background_external_ref, background_reviewed_at, requires_admin_review",
    )
    .single();

  if (error || !data) throw new Error(error?.message ?? "Unable to start identity verification.");

  await writeCleanerPlatformAudit({
    actorId: input.actorId,
    actorRole: "cleaner",
    action: "identity.start",
    cleanerId: input.professionalId,
    metadata: { status, providerConnected: connected },
  });

  return mapVerification(data as Record<string, unknown>);
}

/**
 * Cleaner starts background screening request.
 * If provider not connected → PENDING_PROVIDER + requires admin review.
 * Never sets clear automatically.
 */
export async function startBackgroundScreening(input: {
  professionalId: string;
  actorId: string;
}): Promise<VerificationState> {
  if (!hasAdminEnv()) throw new Error("Database not configured.");

  const connected = backgroundProviderConnected();
  const status: BackgroundStatus = connected ? "pending" : "PENDING_PROVIDER";
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("professionals")
    .update({
      background_status: status,
      background_provider: connected ? "configured" : null,
      platform_stage: "SCREENING",
      requires_admin_review: true,
    })
    .eq("id", input.professionalId)
    .select(
      "identity_status, identity_provider, identity_external_ref, identity_reviewed_at, background_status, background_provider, background_external_ref, background_reviewed_at, requires_admin_review",
    )
    .single();

  if (error || !data) throw new Error(error?.message ?? "Unable to start background screening.");

  await writeCleanerPlatformAudit({
    actorId: input.actorId,
    actorRole: "cleaner",
    action: "background.start",
    cleanerId: input.professionalId,
    metadata: { status, providerConnected: connected },
  });

  return mapVerification(data as Record<string, unknown>);
}

/**
 * Admin review for identity / background while providers are pending.
 * Explicit decision only — never auto-approve because integration is unavailable.
 */
export async function adminReviewVerification(input: {
  professionalId: string;
  adminId: string;
  target: "identity" | "background";
  decision: "clear" | "reject" | "manual_review";
  note?: string | null;
}): Promise<VerificationState> {
  if (!hasAdminEnv()) throw new Error("Database not configured.");
  const now = new Date().toISOString();
  const supabase = createAdminClient();

  const patch: Record<string, unknown> = {
    requires_admin_review: input.decision === "manual_review",
  };

  if (input.target === "identity") {
    if (input.decision === "clear") {
      patch.identity_status = "verified";
      patch.identity_reviewed_at = now;
      patch.identity_reviewed_by = input.adminId;
    } else if (input.decision === "reject") {
      patch.identity_status = "failed";
      patch.identity_reviewed_at = now;
      patch.identity_reviewed_by = input.adminId;
      patch.requires_admin_review = true;
    } else {
      patch.identity_status = "manual_review";
      patch.requires_admin_review = true;
    }
  } else {
    if (input.decision === "clear") {
      // Admin-cleared screening while provider pending — stored as clear with review audit.
      // Public messaging must still not claim "background checked" from a vendor.
      patch.background_status = "clear";
      patch.background_reviewed_at = now;
      patch.background_reviewed_by = input.adminId;
    } else if (input.decision === "reject") {
      patch.background_status = "failed";
      patch.background_reviewed_at = now;
      patch.background_reviewed_by = input.adminId;
      patch.requires_admin_review = true;
    } else {
      patch.background_status = "manual_review";
      patch.requires_admin_review = true;
    }
  }

  const { data, error } = await supabase
    .from("professionals")
    .update(patch as Database["public"]["Tables"]["professionals"]["Update"])
    .eq("id", input.professionalId)
    .select(
      "identity_status, identity_provider, identity_external_ref, identity_reviewed_at, background_status, background_provider, background_external_ref, background_reviewed_at, requires_admin_review",
    )
    .single();

  if (error || !data) throw new Error(error?.message ?? "Unable to review verification.");

  await writeCleanerPlatformAudit({
    actorId: input.adminId,
    actorRole: "admin",
    action: `${input.target}.admin_review`,
    cleanerId: input.professionalId,
    metadata: {
      decision: input.decision,
      note: input.note ?? null,
      providerConnected:
        input.target === "identity"
          ? identityProviderConnected()
          : backgroundProviderConnected(),
    },
  });

  return mapVerification(data as Record<string, unknown>);
}

export async function getVerificationState(
  professionalId: string,
): Promise<VerificationState | null> {
  if (!hasAdminEnv()) return null;
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("professionals")
    .select(
      "identity_status, identity_provider, identity_external_ref, identity_reviewed_at, background_status, background_provider, background_external_ref, background_reviewed_at, requires_admin_review",
    )
    .eq("id", professionalId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;
  return mapVerification(data as Record<string, unknown>);
}

function mapVerification(data: Record<string, unknown>): VerificationState {
  return {
    identityStatus: parseIdentityStatus(data.identity_status ?? defaultIdentityStatus()),
    identityProvider: data.identity_provider ? String(data.identity_provider) : null,
    identityExternalRef: data.identity_external_ref
      ? String(data.identity_external_ref)
      : null,
    identityReviewedAt: data.identity_reviewed_at
      ? String(data.identity_reviewed_at)
      : null,
    backgroundStatus: parseBackgroundStatus(
      data.background_status ?? defaultBackgroundStatus(),
    ),
    backgroundProvider: data.background_provider
      ? String(data.background_provider)
      : null,
    backgroundExternalRef: data.background_external_ref
      ? String(data.background_external_ref)
      : null,
    backgroundReviewedAt: data.background_reviewed_at
      ? String(data.background_reviewed_at)
      : null,
    identityProviderConnected: identityProviderConnected(),
    backgroundProviderConnected: backgroundProviderConnected(),
    requiresAdminReview: Boolean(data.requires_admin_review),
  };
}
