import { createAdminClient } from "@/lib/supabase/admin";
import type { UserRole } from "@/types/database.types";

export interface CustomerProfile {
  id: string;
  clerkUserId: string;
  role: UserRole;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  email: string | null;
  avatarUrl: string | null;
  onboardingComplete: boolean;
}

function mapProfile(row: Record<string, unknown>, email: string | null): CustomerProfile {
  return {
    id: String(row.id),
    clerkUserId: String(row.clerk_user_id),
    role: row.role as UserRole,
    firstName: row.first_name ? String(row.first_name) : null,
    lastName: row.last_name ? String(row.last_name) : null,
    phone: row.phone ? String(row.phone) : null,
    email,
    avatarUrl: row.avatar_url ? String(row.avatar_url) : null,
    onboardingComplete: Boolean(row.onboarding_complete),
  };
}

export async function getProfileByAuthUserId(authUserId: string): Promise<CustomerProfile | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", authUserId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? mapProfile(data as Record<string, unknown>, null) : null;
}

/** @deprecated Use getProfileByAuthUserId */
export async function getProfileByClerkId(clerkUserId: string): Promise<CustomerProfile | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .or(`id.eq.${clerkUserId},clerk_user_id.eq.${clerkUserId}`)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? mapProfile(data as Record<string, unknown>, null) : null;
}

export async function ensureCustomerProfile(input: {
  authUserId: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
}): Promise<CustomerProfile> {
  const existing = await getProfileByAuthUserId(input.authUserId);
  if (existing) {
    return { ...existing, email: input.email };
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("profiles")
    .insert({
      id: input.authUserId,
      clerk_user_id: input.authUserId,
      email: input.email,
      role: "customer",
      first_name: input.firstName ?? null,
      last_name: input.lastName ?? null,
      phone: input.phone ?? null,
      avatar_url: input.avatarUrl ?? null,
      onboarding_complete: true,
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to create profile.");
  }

  await supabase.from("notification_preferences").insert({ profile_id: data.id });

  await linkGuestBookingsToProfile(String(data.id), input.email);

  return mapProfile(data as Record<string, unknown>, input.email);
}

export async function linkGuestBookingsToProfile(
  profileId: string,
  email: string,
): Promise<void> {
  const supabase = createAdminClient();
  await supabase
    .from("bookings")
    .update({ customer_id: profileId })
    .eq("customer_email", email.toLowerCase())
    .is("customer_id", null);
}

export async function updateCustomerProfile(
  profileId: string,
  input: { firstName: string; lastName: string; phone?: string | null },
): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      first_name: input.firstName,
      last_name: input.lastName,
      phone: input.phone ?? null,
    })
    .eq("id", profileId);

  if (error) throw new Error(error.message);
}
