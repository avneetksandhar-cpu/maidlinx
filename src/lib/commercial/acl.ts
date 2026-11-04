import { createAdminClient, hasAdminEnv } from "@/lib/supabase/admin";
import type { BusinessAccount } from "@/lib/commercial/types";

export type MembershipRole = "owner" | "manager" | "billing" | "viewer";

export interface BusinessMembership {
  businessAccountId: string;
  userId: string;
  role: MembershipRole;
}

function mapAccount(row: Record<string, unknown>): BusinessAccount {
  return {
    id: String(row.id),
    name: String(row.name),
    ownerUserId: String(row.owner_user_id),
    status: String(row.status ?? "active"),
  };
}

/** Ensure the buyer has a business account + owner membership. */
export async function getOrCreateBusinessAccountForUser(input: {
  userId: string;
  companyName?: string | null;
}): Promise<BusinessAccount> {
  if (!hasAdminEnv()) {
    throw new Error("Database not configured.");
  }
  const supabase = createAdminClient();

  const { data: membership } = await supabase
    .from("business_memberships" as never)
    .select("business_account_id, role, status")
    .eq("user_id", input.userId)
    .eq("status", "active")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (membership) {
    const row = membership as Record<string, unknown>;
    const { data: account } = await supabase
      .from("business_accounts" as never)
      .select("*")
      .eq("id", String(row.business_account_id))
      .maybeSingle();
    if (account) return mapAccount(account as Record<string, unknown>);
  }

  const name =
    input.companyName?.trim() ||
    `Business ${input.userId.slice(0, 8)}`;

  const { data: created, error } = await supabase
    .from("business_accounts" as never)
    .insert({
      name,
      owner_user_id: input.userId,
      status: "active",
    } as never)
    .select("*")
    .single();

  if (error || !created) {
    throw new Error(error?.message ?? "Unable to create business account.");
  }

  const account = mapAccount(created as Record<string, unknown>);

  const { error: memErr } = await supabase.from("business_memberships" as never).insert({
    business_account_id: account.id,
    user_id: input.userId,
    role: "owner",
    status: "active",
  } as never);

  if (memErr && !/duplicate|unique/i.test(memErr.message)) {
    throw new Error(memErr.message);
  }

  return account;
}

export async function listMembershipsForUser(
  userId: string,
): Promise<BusinessMembership[]> {
  if (!hasAdminEnv()) return [];
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("business_memberships" as never)
    .select("business_account_id, user_id, role")
    .eq("user_id", userId)
    .eq("status", "active");
  if (error) {
    if (/business_memberships|does not exist|schema cache/i.test(error.message)) {
      return [];
    }
    throw new Error(error.message);
  }
  return (data ?? []).map((row) => {
    const r = row as Record<string, unknown>;
    return {
      businessAccountId: String(r.business_account_id),
      userId: String(r.user_id),
      role: String(r.role) as MembershipRole,
    };
  });
}

export async function assertBusinessMember(
  businessAccountId: string,
  userId: string,
  roles?: MembershipRole[],
): Promise<BusinessMembership> {
  const memberships = await listMembershipsForUser(userId);
  const hit = memberships.find((m) => m.businessAccountId === businessAccountId);
  if (!hit) {
    throw new Error("You do not have access to this business.");
  }
  if (roles && roles.length > 0 && !roles.includes(hit.role)) {
    throw new Error("You are not authorized for this action.");
  }
  return hit;
}

/** Entry codes / private access notes — buyers of that business, assigned provider, or admin. */
export async function canViewAccessNotes(input: {
  businessAccountId: string;
  requesterUserId: string;
  requesterRole?: string | null;
  assignedProviderUserId?: string | null;
}): Promise<boolean> {
  if (input.requesterRole === "admin") return true;
  if (
    input.assignedProviderUserId &&
    input.assignedProviderUserId === input.requesterUserId
  ) {
    return true;
  }
  try {
    await assertBusinessMember(input.businessAccountId, input.requesterUserId);
    return true;
  } catch {
    return false;
  }
}

export async function assertSiteOwnedByBusiness(
  siteAddressId: string,
  businessAccountId: string,
): Promise<Record<string, unknown>> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("addresses")
    .select("*")
    .eq("id", siteAddressId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Site not found.");
  const row = data as Record<string, unknown>;
  if (row.business_account_id && String(row.business_account_id) !== businessAccountId) {
    throw new Error("You do not have access to this site.");
  }
  return row;
}

/** Attach an address to the buyer's business account when missing. */
export async function attachSiteToBusiness(input: {
  siteAddressId: string;
  userId: string;
  businessAccountId: string;
}): Promise<void> {
  await assertBusinessMember(input.businessAccountId, input.userId);
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("addresses")
    .select("id, user_id, business_account_id" as never)
    .eq("id", input.siteAddressId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Site not found.");
  const row = data as unknown as Record<string, unknown>;
  if (String(row.user_id) !== input.userId && !row.business_account_id) {
    throw new Error("You do not have access to this site.");
  }
  if (row.business_account_id && String(row.business_account_id) !== input.businessAccountId) {
    throw new Error("You do not have access to this site.");
  }
  if (!row.business_account_id) {
    const { error: updErr } = await supabase
      .from("addresses")
      .update({ business_account_id: input.businessAccountId } as never)
      .eq("id", input.siteAddressId);
    if (updErr) throw new Error(updErr.message);
  }
}
