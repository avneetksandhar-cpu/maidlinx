import { createAdminClient, hasAdminEnv } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
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

async function getDbClient() {
  if (hasAdminEnv()) {
    return createAdminClient();
  }
  // Auth trigger normally creates the row; fall back to the user-scoped client.
  return createClient();
}

function isBootstrapAdminEmail(email: string): boolean {
  const bootstrapEmail = process.env.ADMIN_BOOTSTRAP_EMAIL?.toLowerCase()?.trim();
  return Boolean(bootstrapEmail && email.toLowerCase() === bootstrapEmail);
}

/**
 * Server-only: promote the configured ADMIN_BOOTSTRAP_EMAIL profile to admin.
 * Does not weaken middleware — /owner and /admin still require an authenticated admin role.
 * Uses service role only; never trusts client/metadata role claims.
 */
export async function promoteBootstrapAdminIfNeeded(input: {
  userId: string;
  email: string;
  profile: AuthProfile;
}): Promise<AuthProfile> {
  if (!isBootstrapAdminEmail(input.email) || input.profile.role === "admin") {
    return input.profile;
  }
  if (!hasAdminEnv()) {
    return input.profile;
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("profiles")
    .update({ role: "admin" } as never)
    .eq("id", input.userId)
    .select("id, role, first_name, last_name, phone, avatar_url")
    .maybeSingle();

  if (error || !data) {
    return input.profile;
  }

  return mapProfile(data as Record<string, unknown>);
}

export async function ensureProfileForUser(input: EnsureProfileInput): Promise<AuthProfile> {
  const supabase = await getDbClient();

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

    const profile = mapProfile({ ...existing, ...updates });
    return promoteBootstrapAdminIfNeeded({
      userId: input.userId,
      email: input.email,
      profile,
    });
  }

  // Never allow client/metadata self-assignment of admin.
  const requestedRole = normalizeRole(input.role ?? null);
  const role: UserRole = isBootstrapAdminEmail(input.email)
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
    // Trigger may have raced; re-read own row.
    const { data: raced } = await supabase
      .from("profiles")
      .select("id, role, first_name, last_name, phone, avatar_url")
      .eq("id", input.userId)
      .maybeSingle();
    if (raced) {
      return mapProfile(raced as Record<string, unknown>);
    }
    throw new Error(createError?.message ?? "Failed to create profile.");
  }

  if (hasAdminEnv()) {
    await supabase.from("notification_preferences").insert({ profile_id: created.id });
  }

  return mapProfile(created as Record<string, unknown>);
}
