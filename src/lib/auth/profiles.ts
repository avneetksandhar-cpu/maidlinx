import { createAdminClient } from "@/lib/supabase/admin";
import { normalizeRole } from "@/lib/auth/roles";
import type { AuthProfile, UserRole } from "@/lib/auth/types";

interface EnsureProfileInput {
  userId: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
  role?: UserRole | null;
}

function mapProfile(row: Record<string, unknown>): AuthProfile {
  return {
    id: String(row.id),
    role: normalizeRole(String(row.role)),
    firstName: row.first_name ? String(row.first_name) : null,
    lastName: row.last_name ? String(row.last_name) : null,
    phone: row.phone ? String(row.phone) : null,
    avatarUrl: row.avatar_url ? String(row.avatar_url) : null,
  };
}

export async function ensureProfileForUser(input: EnsureProfileInput): Promise<AuthProfile> {
  const supabase = createAdminClient();

  const { data: existing, error: fetchError } = await supabase
    .from("profiles")
    .select("id, role, first_name, last_name, phone, avatar_url")
    .eq("id", input.userId)
    .maybeSingle();

  if (fetchError) {
    throw new Error(fetchError.message);
  }

  if (existing) {
    const updates: Record<string, unknown> = {};
    if (!existing.first_name && input.firstName) updates.first_name = input.firstName;
    if (!existing.last_name && input.lastName) updates.last_name = input.lastName;
    if (!existing.phone && input.phone) updates.phone = input.phone;
    if (!existing.avatar_url && input.avatarUrl) updates.avatar_url = input.avatarUrl;

    if (Object.keys(updates).length > 0) {
      await supabase.from("profiles").update(updates as never).eq("id", input.userId);
    }

    return mapProfile({ ...existing, ...updates });
  }

  const bootstrapEmail = process.env.ADMIN_BOOTSTRAP_EMAIL?.toLowerCase();
  const requestedRole = normalizeRole(input.role ?? null);
  const role: UserRole =
    bootstrapEmail && input.email.toLowerCase() === bootstrapEmail
      ? "admin"
      : requestedRole === "cleaner"
        ? "cleaner"
        : "customer";

  const { data: created, error: createError } = await supabase
    .from("profiles")
    .insert({
      id: input.userId,
      clerk_user_id: input.userId,
      email: input.email,
      role,
      first_name: input.firstName ?? null,
      last_name: input.lastName ?? null,
      phone: input.phone ?? null,
      avatar_url: input.avatarUrl ?? null,
      onboarding_complete: false,
    })
    .select("id, role, first_name, last_name, phone, avatar_url")
    .single();

  if (createError || !created) {
    throw new Error(createError?.message ?? "Failed to create profile.");
  }

  await supabase.from("notification_preferences").insert({ profile_id: created.id });

  return mapProfile(created as Record<string, unknown>);
}
