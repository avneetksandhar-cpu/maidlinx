import {
  attachSiteToBusiness,
  assertBusinessMember,
  canViewAccessNotes,
  getOrCreateBusinessAccountForUser,
} from "@/lib/commercial/acl";
import {
  buildScopeSummary,
  type CommercialArea,
  type CommercialFrequency,
  type CommercialSiteScope,
  type ServiceDay,
} from "@/lib/commercial/types";
import { createAdminClient, hasAdminEnv } from "@/lib/supabase/admin";

function mapScope(
  row: Record<string, unknown>,
  includeAccessNotes: boolean,
): CommercialSiteScope {
  return {
    id: String(row.id),
    siteAddressId: String(row.site_address_id),
    businessAccountId: String(row.business_account_id),
    areas: Array.isArray(row.areas) ? (row.areas as CommercialArea[]) : [],
    frequency: String(row.frequency ?? "weekly") as CommercialFrequency,
    serviceDays: Array.isArray(row.service_days)
      ? (row.service_days as ServiceDay[])
      : [],
    serviceWindow: row.service_window ? String(row.service_window) : null,
    startDate: row.start_date ? String(row.start_date) : null,
    squareFootage:
      row.square_footage !== null && row.square_footage !== undefined
        ? Number(row.square_footage)
        : null,
    siteContact: row.site_contact ? String(row.site_contact) : null,
    accessNotes: includeAccessNotes && row.access_notes ? String(row.access_notes) : null,
    summaryPlain: String(row.summary_plain ?? ""),
    version: Number(row.version ?? 1),
    updatedAt: String(row.updated_at ?? row.created_at),
  };
}

export async function getScopeForSite(input: {
  siteAddressId: string;
  userId: string;
  requesterRole?: string | null;
}): Promise<CommercialSiteScope | null> {
  if (!hasAdminEnv()) return null;
  const account = await getOrCreateBusinessAccountForUser({ userId: input.userId });
  await attachSiteToBusiness({
    siteAddressId: input.siteAddressId,
    userId: input.userId,
    businessAccountId: account.id,
  });

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("commercial_site_scopes" as never)
    .select("*")
    .eq("site_address_id", input.siteAddressId)
    .maybeSingle();
  if (error) {
    if (/commercial_site_scopes|does not exist|schema cache/i.test(error.message)) {
      return null;
    }
    throw new Error(error.message);
  }
  if (!data) return null;
  const row = data as Record<string, unknown>;
  await assertBusinessMember(String(row.business_account_id), input.userId);
  const allowNotes = await canViewAccessNotes({
    businessAccountId: String(row.business_account_id),
    requesterUserId: input.userId,
    requesterRole: input.requesterRole,
  });
  return mapScope(row, allowNotes);
}

export async function upsertSiteScope(input: {
  userId: string;
  siteAddressId: string;
  areas: CommercialArea[];
  frequency: CommercialFrequency;
  serviceDays: ServiceDay[];
  serviceWindow?: string | null;
  startDate?: string | null;
  squareFootage?: number | null;
  siteContact?: string | null;
  accessNotes?: string | null;
  companyName?: string | null;
}): Promise<CommercialSiteScope> {
  if (!hasAdminEnv()) throw new Error("Database not configured.");
  const account = await getOrCreateBusinessAccountForUser({
    userId: input.userId,
    companyName: input.companyName,
  });
  await attachSiteToBusiness({
    siteAddressId: input.siteAddressId,
    userId: input.userId,
    businessAccountId: account.id,
  });

  const summary = buildScopeSummary({
    areas: input.areas,
    frequency: input.frequency,
    serviceDays: input.serviceDays,
    serviceWindow: input.serviceWindow ?? null,
    squareFootage: input.squareFootage ?? null,
  });

  const supabase = createAdminClient();
  const payload = {
    site_address_id: input.siteAddressId,
    business_account_id: account.id,
    areas: input.areas,
    frequency: input.frequency,
    service_days: input.serviceDays,
    service_window: input.serviceWindow?.trim() || null,
    start_date: input.startDate || null,
    square_footage: input.squareFootage ?? null,
    site_contact: input.siteContact?.trim() || null,
    access_notes: input.accessNotes?.trim() || null,
    summary_plain: summary,
    created_by: input.userId,
    updated_at: new Date().toISOString(),
  };

  const { data: existing } = await supabase
    .from("commercial_site_scopes" as never)
    .select("id, version")
    .eq("site_address_id", input.siteAddressId)
    .maybeSingle();

  let row: Record<string, unknown>;
  if (existing) {
    const ex = existing as Record<string, unknown>;
    const { data, error } = await supabase
      .from("commercial_site_scopes" as never)
      .update({
        ...payload,
        version: Number(ex.version ?? 1) + 1,
      } as never)
      .eq("id", String(ex.id))
      .select("*")
      .single();
    if (error || !data) throw new Error(error?.message ?? "Unable to update scope.");
    row = data as Record<string, unknown>;
  } else {
    const { data, error } = await supabase
      .from("commercial_site_scopes" as never)
      .insert(payload as never)
      .select("*")
      .single();
    if (error || !data) throw new Error(error?.message ?? "Unable to save scope.");
    row = data as Record<string, unknown>;
  }

  // Mirror public site fields (never expose access_notes via list APIs).
  await supabase
    .from("addresses")
    .update({
      square_footage: input.squareFootage ?? null,
      site_contact: input.siteContact?.trim() || null,
      access_notes: input.accessNotes?.trim() || null,
      business_account_id: account.id,
    } as never)
    .eq("id", input.siteAddressId);

  return mapScope(row, true);
}
