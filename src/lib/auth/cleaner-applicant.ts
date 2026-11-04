/**
 * Uber-driver-style cleaner applicant bootstrap.
 * Promotes customer → cleaner for explicit apply / signup metadata only.
 * Never grants admin. Never marks supply bookable (is_active/is_verified stay false).
 *
 * Writes go to public.cleaners (canonical). The professionals view may be stale in
 * some environments and rejects platform columns — do not depend on it for signup.
 */

import { createAdminClient, hasAdminEnv } from "@/lib/supabase/admin";
import { normalizeRole } from "@/lib/auth/roles";
import type { UserRole } from "@/lib/auth/types";

export interface CleanerApplicantResult {
  role: UserRole;
  professionalId: string | null;
  created: boolean;
  upgraded: boolean;
}

export function wantsCleanerApplicant(input: {
  metadataRole?: string | null;
  nextPath?: string | null;
  explicit?: boolean;
}): boolean {
  if (input.explicit) return true;
  const meta = normalizeRole(input.metadataRole ?? null);
  if (meta === "cleaner") return true;
  const next = input.nextPath ?? "";
  return (
    next.startsWith("/cleaner") ||
    next.startsWith("/pro") ||
    next.includes("cleanerApplication") ||
    next.includes("/earn")
  );
}

export async function ensureCleanerApplicant(input: {
  userId: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
}): Promise<CleanerApplicantResult> {
  if (!hasAdminEnv()) {
    throw new Error("Cleaner signup is temporarily unavailable. Please try again shortly.");
  }

  const supabase = createAdminClient();

  const { data: existing, error: fetchError } = await supabase
    .from("profiles")
    .select("id, role, first_name, last_name, phone, avatar_url")
    .eq("id", input.userId)
    .maybeSingle();

  if (fetchError) throw new Error(fetchError.message);

  let upgraded = false;
  let created = false;
  let role: UserRole = "cleaner";

  if (existing) {
    const current = normalizeRole(String(existing.role));
    if (current === "admin") {
      role = "admin";
    } else if (current === "cleaner") {
      role = "cleaner";
    } else {
      const { error: roleError } = await supabase
        .from("profiles")
        .update({ role: "cleaner" } as never)
        .eq("id", input.userId);
      if (roleError) throw new Error(roleError.message);
      upgraded = true;
      role = "cleaner";
    }

    const profilePatch: Record<string, unknown> = {};
    if (!existing.first_name && input.firstName) profilePatch.first_name = input.firstName;
    if (!existing.last_name && input.lastName) profilePatch.last_name = input.lastName;
    if (!existing.phone && input.phone) profilePatch.phone = input.phone;
    if (!existing.avatar_url && input.avatarUrl) profilePatch.avatar_url = input.avatarUrl;
    if (Object.keys(profilePatch).length > 0) {
      await supabase.from("profiles").update(profilePatch as never).eq("id", input.userId);
    }
  } else {
    const { error: insertError } = await supabase.from("profiles").insert({
      id: input.userId,
      clerk_user_id: input.userId,
      email: input.email,
      role: "cleaner",
      first_name: input.firstName ?? null,
      last_name: input.lastName ?? null,
      phone: input.phone ?? null,
      avatar_url: input.avatarUrl ?? null,
      onboarding_complete: false,
    } as never);

    if (insertError) throw new Error(insertError.message);
    created = true;
    role = "cleaner";

    await supabase.from("notification_preferences").insert({ profile_id: input.userId } as never);
  }

  // Applicant row on canonical cleaners table — never auto-activate/verify.
  const { data: cleaner, error: cleanerFetchError } = await supabase
    .from("cleaners")
    .select("id")
    .eq("user_id", input.userId)
    .maybeSingle();

  if (cleanerFetchError) throw new Error(cleanerFetchError.message);

  if (cleaner?.id) {
    return { role, professionalId: String(cleaner.id), created, upgraded };
  }

  const { data: createdCleaner, error: createCleanerError } = await supabase
    .from("cleaners")
    .insert({
      user_id: input.userId,
      is_active: false,
      is_verified: false,
      onboarding_status: "NOT_STARTED",
      is_online: false,
      stripe_connect_status: "NOT_STARTED",
      platform_stage: "APPLICANT",
    } as never)
    .select("id")
    .single();

  if (createCleanerError || !createdCleaner) {
    throw new Error(createCleanerError?.message ?? "Failed to create cleaner applicant record.");
  }

  return {
    role,
    professionalId: String(createdCleaner.id),
    created: true,
    upgraded,
  };
}
