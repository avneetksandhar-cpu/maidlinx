import { createAdminClient, hasAdminEnv } from "@/lib/supabase/admin";
import { writeAuditLog } from "@/lib/admin/audit";
import { reviewCleanerOnboarding } from "@/lib/cleaners/onboarding-store";
import {
  parseOnboardingStatus,
  parseStripeConnectStatus,
  type CleanerOnboardingStatus,
  type StripeConnectStatus,
} from "@/lib/cleaners/onboarding";

export interface AdminCleaner {
  id: string;
  profileId: string;
  professionalId: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  bio: string | null;
  isVerified: boolean;
  isActive: boolean;
  onboardingStatus: CleanerOnboardingStatus;
  isOnline: boolean;
  stripeConnectStatus: StripeConnectStatus;
  ratingAverage: number;
  ratingCount: number;
  completedJobs: number;
  createdAt: string;
  rejectionReason: string | null;
}

export interface AdminCleanerOption {
  profileId: string;
  name: string;
  isActive: boolean;
}

export async function listCleanerOptions(): Promise<AdminCleanerOption[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("professionals")
    .select(
      `
      is_active,
      onboarding_status,
      profile:profiles!professionals_profile_id_fkey (id, first_name, last_name)
    `,
    )
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  return (data ?? [])
    .map((row) => {
      const record = row as Record<string, unknown>;
      const profile = record.profile as Record<string, unknown> | null;
      if (!profile) return null;
      return {
        profileId: String(profile.id),
        name: [profile.first_name, profile.last_name].filter(Boolean).join(" ") || "Unnamed",
        isActive: Boolean(record.is_active),
      };
    })
    .filter((c): c is AdminCleanerOption => c !== null);
}

export async function listCleaners(search?: string, limit = 50): Promise<AdminCleaner[]> {
  if (!hasAdminEnv()) {
    return [];
  }

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("professionals")
    .select(
      `
      *,
      profile:profiles!professionals_profile_id_fkey (*)
    `,
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);

  let rows = data ?? [];

  if (search) {
    const term = search.toLowerCase();
    rows = rows.filter((row) => {
      const record = row as Record<string, unknown>;
      const profile = record.profile as Record<string, unknown> | null;
      const name = [profile?.first_name, profile?.last_name].filter(Boolean).join(" ").toLowerCase();
      return name.includes(term);
    });
  }

  return Promise.all(
    rows.map(async (row) => {
      const record = row as Record<string, unknown>;
      const profile = record.profile as Record<string, unknown>;
      const profileId = String(profile.id);

      const { count } = await supabase
        .from("bookings")
        .select("*", { count: "exact", head: true })
        .eq("professional_profile_id", profileId)
        .eq("status", "completed");

      return {
        id: profileId,
        profileId,
        professionalId: String(record.id),
        firstName: profile.first_name ? String(profile.first_name) : null,
        lastName: profile.last_name ? String(profile.last_name) : null,
        phone: profile.phone ? String(profile.phone) : null,
        bio: record.bio ? String(record.bio) : null,
        isVerified: Boolean(record.is_verified),
        isActive: Boolean(record.is_active),
        onboardingStatus: parseOnboardingStatus(record.onboarding_status),
        isOnline: Boolean(record.is_online),
        stripeConnectStatus: parseStripeConnectStatus(record.stripe_connect_status),
        ratingAverage: Number(record.rating_average),
        ratingCount: Number(record.rating_count),
        completedJobs: count ?? 0,
        createdAt: String(record.created_at),
        rejectionReason: record.rejection_reason ? String(record.rejection_reason) : null,
      };
    }),
  );
}

export async function listPendingCleanerApprovals(limit = 50): Promise<AdminCleaner[]> {
  const all = await listCleaners(undefined, 200);
  return all
    .filter((c) =>
      ["SUBMITTED", "UNDER_REVIEW", "IN_PROGRESS"].includes(c.onboardingStatus),
    )
    .slice(0, limit);
}

export async function updateCleanerStatus(
  adminId: string,
  professionalId: string,
  updates: { isVerified?: boolean; isActive?: boolean },
): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase.from("professionals").update(updates).eq("id", professionalId);

  if (error) throw new Error(error.message);

  await writeAuditLog({
    adminProfileId: adminId,
    action: "cleaner.update_status",
    entityType: "professional",
    entityId: professionalId,
    metadata: updates,
  });
}

export async function approveOrRejectCleaner(
  adminId: string,
  professionalId: string,
  decision: "approve" | "reject" | "suspend",
  rejectionReason?: string | null,
): Promise<void> {
  await reviewCleanerOnboarding({
    professionalId,
    adminId,
    decision,
    rejectionReason,
  });

  await writeAuditLog({
    adminProfileId: adminId,
    action: `cleaner.onboarding.${decision}`,
    entityType: "professional",
    entityId: professionalId,
    metadata: { decision, rejectionReason: rejectionReason ?? null },
  });
}

export async function bulkUpdateCleaners(
  adminId: string,
  professionalIds: string[],
  updates: { isVerified?: boolean; isActive?: boolean },
): Promise<number> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("professionals")
    .update(updates)
    .in("id", professionalIds)
    .select("id");

  if (error) throw new Error(error.message);

  await writeAuditLog({
    adminProfileId: adminId,
    action: "cleaners.bulk_update",
    entityType: "professional",
    metadata: { professionalIds, updates, count: data?.length ?? 0 },
  });

  return data?.length ?? 0;
}
