import { ACTIVE_JOB_STATUSES } from "@/lib/bookings/status";
import { createAdminClient, hasAdminEnv } from "@/lib/supabase/admin";
import type { UserRole } from "@/lib/auth/types";

export const ACCOUNT_DELETE_CONFIRM_PHRASE = "DELETE";

export function accountDeletionConfirmed(confirm: unknown): boolean {
  return typeof confirm === "string" && confirm.trim() === ACCOUNT_DELETE_CONFIRM_PHRASE;
}

export function anonymizedDeletedEmail(userId: string): string {
  return `deleted-${userId}@deleted.maidlinx.invalid`;
}

/**
 * Soft-delete / anonymize a MaidLinx account.
 * Keeps booking + payment audit rows (ON DELETE RESTRICT); clears sign-in.
 */
export async function softDeleteAccount(input: {
  userId: string;
  role: UserRole;
}): Promise<{ ok: true } | { ok: false; error: string; status: number }> {
  if (input.role === "admin") {
    return {
      ok: false,
      error: "Admin accounts cannot be deleted in-app. Contact support.",
      status: 403,
    };
  }

  if (!hasAdminEnv()) {
    return {
      ok: false,
      error: "Account deletion is temporarily unavailable. Please try again later.",
      status: 503,
    };
  }

  const supabase = createAdminClient();
  const deletedEmail = anonymizedDeletedEmail(input.userId);

  const { data: activeAsCustomer, error: customerActiveError } = await supabase
    .from("bookings")
    .select("id")
    .eq("customer_id", input.userId)
    .in("status", [...ACTIVE_JOB_STATUSES])
    .limit(1);

  if (customerActiveError) {
    return { ok: false, error: "Could not verify active bookings.", status: 500 };
  }
  if (activeAsCustomer && activeAsCustomer.length > 0) {
    return {
      ok: false,
      error:
        "You have an active job in progress. Finish or cancel it with support before deleting your account.",
      status: 409,
    };
  }

  const { data: activeAsCleaner } = await supabase
    .from("bookings")
    .select("id")
    .eq("professional_profile_id", input.userId)
    .in("status", [...ACTIVE_JOB_STATUSES])
    .limit(1);

  if (activeAsCleaner && activeAsCleaner.length > 0) {
    return {
      ok: false,
      error:
        "You have an active job in progress. Finish or cancel it with support before deleting your account.",
      status: 409,
    };
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      first_name: null,
      last_name: null,
      phone: null,
      avatar_url: null,
      email: deletedEmail,
      onboarding_complete: false,
    } as never)
    .eq("id", input.userId);

  if (profileError) {
    return { ok: false, error: "Could not anonymize this account.", status: 500 };
  }

  // Keep booking/payment rows; scrub guest-facing email copies only.
  await supabase
    .from("bookings")
    .update({ customer_email: deletedEmail } as never)
    .eq("customer_id", input.userId);

  // Remove saved places that are not pinned by bookings (booking addresses stay for audit).
  const { data: bookingAddressRows } = await supabase
    .from("bookings")
    .select("address_id")
    .eq("customer_id", input.userId);

  const pinnedAddressIds = new Set(
    (bookingAddressRows ?? [])
      .map((row) => (row as { address_id?: string | null }).address_id)
      .filter((id): id is string => Boolean(id)),
  );

  const { data: addressesByProfile } = await supabase
    .from("addresses")
    .select("id")
    .eq("profile_id", input.userId);

  for (const row of addressesByProfile ?? []) {
    const id = String((row as { id: string }).id);
    if (pinnedAddressIds.has(id)) {
      await supabase
        .from("addresses")
        .update({
          label: "Deleted account",
          line2: null,
          // Keep line1/city/region/postal for historical job location audit.
        } as never)
        .eq("id", id);
      continue;
    }
    await supabase.from("addresses").delete().eq("id", id);
  }

  // Best-effort cleanup — optional tables must not block sign-in disable.
  await supabase.from("notification_preferences").delete().eq("profile_id", input.userId);
  await supabase
    .from("customer_favorite_cleaners")
    .delete()
    .eq("customer_profile_id", input.userId);
  await supabase.from("cleaner_live_locations").delete().eq("cleaner_id", input.userId);

  const { error: authError } = await supabase.auth.admin.updateUserById(input.userId, {
    email: deletedEmail,
    ban_duration: "876600h",
    user_metadata: {
      deleted: true,
      deleted_at: new Date().toISOString(),
      first_name: null,
      last_name: null,
      avatar_url: null,
      role: input.role,
    },
  });

  if (authError) {
    return {
      ok: false,
      error: "Profile was anonymized but sign-in could not be disabled. Contact support.",
      status: 500,
    };
  }

  return { ok: true };
}
