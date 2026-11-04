import {
  assertBusinessMember,
  getOrCreateBusinessAccountForUser,
} from "@/lib/commercial/acl";
import { createServiceOrderFromProposal } from "@/lib/commercial/orders";
import {
  checklistFromAreas,
  type BillingCadence,
  type CommercialFrequency,
  type CommercialProposal,
  type ProposalStatus,
} from "@/lib/commercial/types";
import { createAdminClient, hasAdminEnv } from "@/lib/supabase/admin";

function mapProposal(row: Record<string, unknown>): CommercialProposal {
  return {
    id: String(row.id),
    businessAccountId: String(row.business_account_id),
    siteAddressId: String(row.site_address_id),
    scopeId: row.scope_id ? String(row.scope_id) : null,
    providerCleanerId: row.provider_cleaner_id ? String(row.provider_cleaner_id) : null,
    providerUserId: row.provider_user_id ? String(row.provider_user_id) : null,
    providerName: row.provider_name ? String(row.provider_name) : null,
    status: String(row.status) as ProposalStatus,
    inclusions: row.inclusions ? String(row.inclusions) : null,
    exclusions: row.exclusions ? String(row.exclusions) : null,
    clientPriceCents: Number(row.client_price_cents ?? 0),
    providerPayoutCents: Number(row.provider_payout_cents ?? 0),
    frequency: String(row.frequency) as CommercialFrequency,
    billingCadence: String(row.billing_cadence) as BillingCadence,
    firstVisitDate: row.first_visit_date ? String(row.first_visit_date) : null,
    dueNowCents: Number(row.due_now_cents ?? 0),
    paymentExpected: String(row.payment_expected ?? "after_first_visit"),
    scopeSnapshot:
      row.scope_snapshot && typeof row.scope_snapshot === "object"
        ? (row.scope_snapshot as Record<string, unknown>)
        : {},
    walkthroughRequested: Boolean(row.walkthrough_requested),
    approvedAt: row.approved_at ? String(row.approved_at) : null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export async function listProposalsForSite(input: {
  siteAddressId: string;
  userId: string;
}): Promise<CommercialProposal[]> {
  if (!hasAdminEnv()) return [];
  const account = await getOrCreateBusinessAccountForUser({ userId: input.userId });
  await assertBusinessMember(account.id, input.userId);

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("commercial_proposals" as never)
    .select("*")
    .eq("site_address_id", input.siteAddressId)
    .eq("business_account_id", account.id)
    .order("created_at", { ascending: false });
  if (error) {
    if (/commercial_proposals|does not exist|schema cache/i.test(error.message)) {
      return [];
    }
    throw new Error(error.message);
  }
  return (data ?? []).map((r) => mapProposal(r as Record<string, unknown>));
}

export async function listOpenOpportunitiesForProvider(
  cleanerId: string,
): Promise<
  Array<{
    scopeId: string;
    siteAddressId: string;
    businessAccountId: string;
    summaryPlain: string;
    frequency: string;
    serviceDays: string[];
    serviceWindow: string | null;
    siteLabel: string;
    city: string;
  }>
> {
  if (!hasAdminEnv()) return [];
  const supabase = createAdminClient();

  // Open scopes that do not yet have an approved order — honest empty if none.
  const { data: scopes, error } = await supabase
    .from("commercial_site_scopes" as never)
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(50);
  if (error) {
    if (/commercial_site_scopes|does not exist|schema cache/i.test(error.message)) {
      return [];
    }
    throw new Error(error.message);
  }

  const { data: myProposals } = await supabase
    .from("commercial_proposals" as never)
    .select("site_address_id, status")
    .eq("provider_cleaner_id", cleanerId);

  const proposedSites = new Set(
    (myProposals ?? [])
      .map((p) => p as Record<string, unknown>)
      .filter((p) => ["sent", "awaiting_approval", "approved"].includes(String(p.status)))
      .map((p) => String(p.site_address_id)),
  );

  const out: Array<{
    scopeId: string;
    siteAddressId: string;
    businessAccountId: string;
    summaryPlain: string;
    frequency: string;
    serviceDays: string[];
    serviceWindow: string | null;
    siteLabel: string;
    city: string;
  }> = [];

  for (const raw of scopes ?? []) {
    const scope = raw as Record<string, unknown>;
    const siteId = String(scope.site_address_id);
    if (proposedSites.has(siteId)) continue;

    const { data: order } = await supabase
      .from("service_orders" as never)
      .select("id")
      .eq("site_address_id", siteId)
      .eq("status", "active")
      .maybeSingle();
    if (order) continue;

    const { data: site } = await supabase
      .from("addresses")
      .select("id, label, city, state")
      .eq("id", siteId)
      .maybeSingle();
    if (!site) continue;
    const siteRow = site as Record<string, unknown>;
    out.push({
      scopeId: String(scope.id),
      siteAddressId: siteId,
      businessAccountId: String(scope.business_account_id),
      summaryPlain: String(scope.summary_plain ?? ""),
      frequency: String(scope.frequency),
      serviceDays: Array.isArray(scope.service_days)
        ? (scope.service_days as string[])
        : [],
      serviceWindow: scope.service_window ? String(scope.service_window) : null,
      siteLabel: String(siteRow.label ?? "Site"),
      city: String(siteRow.city ?? ""),
    });
  }

  return out;
}

export async function createProviderProposal(input: {
  cleanerId: string;
  providerUserId: string;
  providerName: string;
  siteAddressId: string;
  scopeId: string;
  clientPriceCents: number;
  providerPayoutCents: number;
  inclusions?: string | null;
  exclusions?: string | null;
  billingCadence?: BillingCadence;
  firstVisitDate?: string | null;
  dueNowCents?: number;
  paymentExpected?: string;
  idempotencyKey: string;
}): Promise<CommercialProposal> {
  if (!hasAdminEnv()) throw new Error("Database not configured.");
  if (input.clientPriceCents < 0 || input.providerPayoutCents < 0) {
    throw new Error("Amounts must be non-negative.");
  }
  if (input.providerPayoutCents > input.clientPriceCents) {
    throw new Error("Provider payout cannot exceed client price.");
  }

  const supabase = createAdminClient();

  const { data: existing } = await supabase
    .from("commercial_proposals" as never)
    .select("*")
    .eq("idempotency_key", input.idempotencyKey)
    .maybeSingle();
  if (existing) return mapProposal(existing as Record<string, unknown>);

  const { data: scope, error: scopeErr } = await supabase
    .from("commercial_site_scopes" as never)
    .select("*")
    .eq("id", input.scopeId)
    .eq("site_address_id", input.siteAddressId)
    .maybeSingle();
  if (scopeErr) throw new Error(scopeErr.message);
  if (!scope) throw new Error("Scope not found for this site.");
  const scopeRow = scope as Record<string, unknown>;

  const areas = Array.isArray(scopeRow.areas) ? (scopeRow.areas as string[]) : [];
  const snapshot = {
    areas,
    frequency: scopeRow.frequency,
    service_days: scopeRow.service_days,
    service_window: scopeRow.service_window,
    start_date: scopeRow.start_date,
    square_footage: scopeRow.square_footage,
    summary_plain: scopeRow.summary_plain,
    checklist: checklistFromAreas(areas),
  };

  const { data, error } = await supabase
    .from("commercial_proposals" as never)
    .insert({
      business_account_id: String(scopeRow.business_account_id),
      site_address_id: input.siteAddressId,
      scope_id: input.scopeId,
      provider_cleaner_id: input.cleanerId,
      provider_user_id: input.providerUserId,
      provider_name: input.providerName,
      status: "awaiting_approval",
      inclusions: input.inclusions?.trim() || areas.map(String).join(", "),
      exclusions: input.exclusions?.trim() || null,
      client_price_cents: input.clientPriceCents,
      provider_payout_cents: input.providerPayoutCents,
      frequency: String(scopeRow.frequency),
      billing_cadence: input.billingCadence ?? "monthly",
      first_visit_date: input.firstVisitDate ?? scopeRow.start_date ?? null,
      due_now_cents: input.dueNowCents ?? 0,
      payment_expected: input.paymentExpected ?? "after_first_visit",
      scope_snapshot: snapshot,
      idempotency_key: input.idempotencyKey,
    } as never)
    .select("*")
    .single();

  if (error) {
    if (/idempotency|duplicate|unique/i.test(error.message)) {
      const { data: again } = await supabase
        .from("commercial_proposals" as never)
        .select("*")
        .eq("idempotency_key", input.idempotencyKey)
        .maybeSingle();
      if (again) return mapProposal(again as Record<string, unknown>);
    }
    throw new Error(error.message);
  }

  return mapProposal(data as Record<string, unknown>);
}

/**
 * Authorized buyer approves → exactly ONE service order (proposal_id unique).
 * Idempotent on re-approve of already-approved proposal.
 */
export async function approveProposal(input: {
  proposalId: string;
  userId: string;
}): Promise<{ proposal: CommercialProposal; serviceOrderId: string; visitBookingId: string | null }> {
  if (!hasAdminEnv()) throw new Error("Database not configured.");
  const supabase = createAdminClient();

  const { data: proposalRow, error } = await supabase
    .from("commercial_proposals" as never)
    .select("*")
    .eq("id", input.proposalId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!proposalRow) throw new Error("Proposal not found.");
  const proposal = mapProposal(proposalRow as Record<string, unknown>);

  await assertBusinessMember(proposal.businessAccountId, input.userId, [
    "owner",
    "manager",
  ]);

  if (proposal.status === "approved") {
    const { data: existingOrder } = await supabase
      .from("service_orders" as never)
      .select("id")
      .eq("proposal_id", proposal.id)
      .maybeSingle();
    if (!existingOrder) {
      throw new Error("Approved proposal is missing its service order.");
    }
    const orderId = String((existingOrder as Record<string, unknown>).id);
    const { data: visit } = await supabase
      .from("bookings")
      .select("id")
      .eq("service_order_id" as never, orderId)
      .order("scheduled_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    return {
      proposal,
      serviceOrderId: orderId,
      visitBookingId: visit ? String((visit as Record<string, unknown>).id) : null,
    };
  }

  if (!["sent", "awaiting_approval"].includes(proposal.status)) {
    throw new Error(`Proposal cannot be approved from status ${proposal.status}.`);
  }

  const now = new Date().toISOString();
  const { data: updated, error: updErr } = await supabase
    .from("commercial_proposals" as never)
    .update({
      status: "approved",
      approved_at: now,
      approved_by: input.userId,
      updated_at: now,
    } as never)
    .eq("id", proposal.id)
    .in("status", ["sent", "awaiting_approval"])
    .select("*")
    .maybeSingle();

  if (updErr) throw new Error(updErr.message);
  if (!updated) {
    // Race: another approve won — reload
    return approveProposal(input);
  }

  const approved = mapProposal(updated as Record<string, unknown>);
  const order = await createServiceOrderFromProposal({
    proposal: approved,
    approvedByUserId: input.userId,
  });

  return {
    proposal: approved,
    serviceOrderId: order.serviceOrder.id,
    visitBookingId: order.firstVisitBookingId,
  };
}

export async function requestWalkthrough(input: {
  proposalId: string;
  userId: string;
}): Promise<CommercialProposal> {
  const supabase = createAdminClient();
  const { data: row, error } = await supabase
    .from("commercial_proposals" as never)
    .select("*")
    .eq("id", input.proposalId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!row) throw new Error("Proposal not found.");
  const proposal = mapProposal(row as Record<string, unknown>);
  await assertBusinessMember(proposal.businessAccountId, input.userId);

  const { data: updated, error: updErr } = await supabase
    .from("commercial_proposals" as never)
    .update({
      walkthrough_requested: true,
      updated_at: new Date().toISOString(),
    } as never)
    .eq("id", proposal.id)
    .select("*")
    .single();
  if (updErr || !updated) throw new Error(updErr?.message ?? "Unable to request walkthrough.");
  return mapProposal(updated as Record<string, unknown>);
}

export async function getProposalForBuyer(
  proposalId: string,
  userId: string,
): Promise<CommercialProposal | null> {
  if (!hasAdminEnv()) return null;
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("commercial_proposals" as never)
    .select("*")
    .eq("id", proposalId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  const proposal = mapProposal(data as Record<string, unknown>);
  await assertBusinessMember(proposal.businessAccountId, userId);
  return proposal;
}
