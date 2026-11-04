import {
  contributionMarginCents,
  type CommercialOpsCase,
  type OpsCaseType,
} from "@/lib/commercial/types";
import { createAdminClient, hasAdminEnv } from "@/lib/supabase/admin";

function mapCase(row: Record<string, unknown>): CommercialOpsCase {
  return {
    id: String(row.id),
    caseType: String(row.case_type) as OpsCaseType,
    status: String(row.status) as CommercialOpsCase["status"],
    businessAccountId: row.business_account_id ? String(row.business_account_id) : null,
    serviceOrderId: row.service_order_id ? String(row.service_order_id) : null,
    bookingId: row.booking_id ? String(row.booking_id) : null,
    followUpOwnerUserId: row.follow_up_owner_user_id
      ? String(row.follow_up_owner_user_id)
      : null,
    summary: String(row.summary),
    resolutionNotes: row.resolution_notes ? String(row.resolution_notes) : null,
    resolvedAt: row.resolved_at ? String(row.resolved_at) : null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export async function openOpsCase(input: {
  caseType: OpsCaseType;
  summary: string;
  businessAccountId?: string | null;
  serviceOrderId?: string | null;
  bookingId?: string | null;
  followUpOwnerUserId?: string | null;
}): Promise<CommercialOpsCase | null> {
  if (!hasAdminEnv()) return null;
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("commercial_ops_cases" as never)
    .insert({
      case_type: input.caseType,
      status: "open",
      business_account_id: input.businessAccountId ?? null,
      service_order_id: input.serviceOrderId ?? null,
      booking_id: input.bookingId ?? null,
      follow_up_owner_user_id: input.followUpOwnerUserId ?? null,
      summary: input.summary.trim(),
    } as never)
    .select("*")
    .single();
  if (error) {
    if (/commercial_ops_cases|does not exist|schema cache/i.test(error.message)) {
      return null;
    }
    throw new Error(error.message);
  }
  return mapCase(data as Record<string, unknown>);
}

export async function listOpsDesk(): Promise<{
  unfilled: CommercialOpsCase[];
  cancellations: CommercialOpsCase[];
  missedWork: CommercialOpsCase[];
  unpaidInvoices: CommercialOpsCase[];
  payoutIssues: CommercialOpsCase[];
}> {
  const empty = {
    unfilled: [] as CommercialOpsCase[],
    cancellations: [] as CommercialOpsCase[],
    missedWork: [] as CommercialOpsCase[],
    unpaidInvoices: [] as CommercialOpsCase[],
    payoutIssues: [] as CommercialOpsCase[],
  };
  if (!hasAdminEnv()) return empty;

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("commercial_ops_cases" as never)
    .select("*")
    .in("status", ["open", "in_progress"])
    .order("updated_at", { ascending: false })
    .limit(200);
  if (error) {
    if (/commercial_ops_cases|does not exist|schema cache/i.test(error.message)) {
      return empty;
    }
    throw new Error(error.message);
  }

  const cases = (data ?? []).map((r) => mapCase(r as Record<string, unknown>));

  // Also surface real unpaid commercial bookings as synthetic unpaid cases if none logged.
  const { data: unpaid } = await supabase
    .from("bookings")
    .select("id, service_order_id, payment_status, total_cents, status" as never)
    .not("service_order_id" as never, "is", null)
    .neq("payment_status", "paid")
    .neq("status", "cancelled")
    .limit(50);

  const unpaidCases: CommercialOpsCase[] = cases.filter((c) => c.caseType === "unpaid_invoice");
  for (const raw of unpaid ?? []) {
    const b = raw as unknown as Record<string, unknown>;
    const bookingId = String(b.id);
    if (unpaidCases.some((c) => c.bookingId === bookingId)) continue;
    unpaidCases.push({
      id: `synthetic-unpaid-${bookingId}`,
      caseType: "unpaid_invoice",
      status: "open",
      businessAccountId: null,
      serviceOrderId: b.service_order_id ? String(b.service_order_id) : null,
      bookingId,
      followUpOwnerUserId: null,
      summary: `Invoice unpaid · $${(Number(b.total_cents ?? 0) / 100).toFixed(0)}`,
      resolutionNotes: null,
      resolvedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  return {
    unfilled: cases.filter((c) => c.caseType === "unfilled_visit"),
    cancellations: cases.filter((c) => c.caseType === "cancellation"),
    missedWork: cases.filter((c) => c.caseType === "missed_work"),
    unpaidInvoices: unpaidCases,
    payoutIssues: cases.filter((c) => c.caseType === "payout_issue"),
  };
}

export async function resolveOpsCase(input: {
  caseId: string;
  adminUserId: string;
  resolutionNotes: string;
  followUpOwnerUserId?: string | null;
}): Promise<CommercialOpsCase> {
  if (input.caseId.startsWith("synthetic-")) {
    throw new Error("Open a tracked ops case from the service order before resolving.");
  }
  const supabase = createAdminClient();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("commercial_ops_cases" as never)
    .update({
      status: "resolved",
      resolution_notes: input.resolutionNotes.trim(),
      follow_up_owner_user_id:
        input.followUpOwnerUserId ?? input.adminUserId,
      resolved_at: now,
      updated_at: now,
    } as never)
    .eq("id", input.caseId)
    .select("*")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Unable to resolve case.");
  return mapCase(data as Record<string, unknown>);
}

export async function assignOpsFollowUp(input: {
  caseId: string;
  followUpOwnerUserId: string;
}): Promise<CommercialOpsCase> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("commercial_ops_cases" as never)
    .update({
      follow_up_owner_user_id: input.followUpOwnerUserId,
      status: "in_progress",
      updated_at: new Date().toISOString(),
    } as never)
    .eq("id", input.caseId)
    .select("*")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Unable to assign follow-up.");
  return mapCase(data as Record<string, unknown>);
}

export async function getOrderContribution(orderId: string): Promise<{
  clientPriceCents: number;
  providerPayoutCents: number;
  variableCostCents: number;
  contributionCents: number;
  estimateLabel: string;
} | null> {
  if (!hasAdminEnv()) return null;
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("service_orders" as never)
    .select("client_price_cents, provider_payout_cents, variable_cost_cents")
    .eq("id", orderId)
    .maybeSingle();
  if (error || !data) return null;
  const row = data as Record<string, unknown>;
  const clientPriceCents = Number(row.client_price_cents ?? 0);
  const providerPayoutCents = Number(row.provider_payout_cents ?? 0);
  const variableCostCents = Number(row.variable_cost_cents ?? 0);
  return {
    clientPriceCents,
    providerPayoutCents,
    variableCostCents,
    contributionCents: contributionMarginCents({
      clientPriceCents,
      providerPayoutCents,
      variableCostCents,
    }),
    estimateLabel: "Estimate — variable costs as recorded",
  };
}
