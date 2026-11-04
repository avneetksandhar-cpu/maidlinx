import { checklistFromAreas, type CommercialProposal, type ServiceOrder } from "@/lib/commercial/types";
import { assertBusinessMember } from "@/lib/commercial/acl";
import { afterHoursArrivalWindow } from "@/lib/commercial/confirmation";
import { createAdminClient, hasAdminEnv } from "@/lib/supabase/admin";
import { openOpsCase } from "@/lib/commercial/ops";

function mapOrder(row: Record<string, unknown>): ServiceOrder {
  const checklistRaw = row.agreed_checklist;
  const agreedChecklist = Array.isArray(checklistRaw)
    ? (checklistRaw as Array<{ id: string; label: string }>)
    : [];
  return {
    id: String(row.id),
    proposalId: String(row.proposal_id),
    businessAccountId: String(row.business_account_id),
    siteAddressId: String(row.site_address_id),
    providerCleanerId: row.provider_cleaner_id ? String(row.provider_cleaner_id) : null,
    crewLeadUserId: row.crew_lead_user_id ? String(row.crew_lead_user_id) : null,
    status: String(row.status) as ServiceOrder["status"],
    clientPriceCents: Number(row.client_price_cents ?? 0),
    providerPayoutCents: Number(row.provider_payout_cents ?? 0),
    variableCostCents: Number(row.variable_cost_cents ?? 0),
    frequency: String(row.frequency),
    billingCadence: String(row.billing_cadence),
    scopeSnapshot:
      row.scope_snapshot && typeof row.scope_snapshot === "object"
        ? (row.scope_snapshot as Record<string, unknown>)
        : {},
    agreedChecklist,
    nextVisitAt: row.next_visit_at ? String(row.next_visit_at) : null,
    cancelReason: row.cancel_reason ? String(row.cancel_reason) : null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function nextVisitIso(firstVisitDate: string | null, frequency: string): string {
  if (firstVisitDate) {
    const d = new Date(`${firstVisitDate}T18:00:00`);
    if (!Number.isNaN(d.getTime())) return d.toISOString();
  }
  const d = new Date();
  d.setDate(d.getDate() + (frequency === "one_time" ? 1 : 2));
  d.setHours(18, 0, 0, 0);
  return d.toISOString();
}

function advanceNextVisit(fromIso: string, frequency: string): string {
  const d = new Date(fromIso);
  if (frequency === "one_time") return fromIso;
  if (frequency === "biweekly") d.setDate(d.getDate() + 14);
  else if (frequency === "monthly") d.setMonth(d.getMonth() + 1);
  else d.setDate(d.getDate() + 7);
  return d.toISOString();
}

export async function createServiceOrderFromProposal(input: {
  proposal: CommercialProposal;
  approvedByUserId: string;
}): Promise<{ serviceOrder: ServiceOrder; firstVisitBookingId: string | null }> {
  const supabase = createAdminClient();
  const proposal = input.proposal;

  const { data: existing } = await supabase
    .from("service_orders" as never)
    .select("*")
    .eq("proposal_id", proposal.id)
    .maybeSingle();
  if (existing) {
    const order = mapOrder(existing as Record<string, unknown>);
    const { data: visit } = await supabase
      .from("bookings")
      .select("id")
      .eq("service_order_id" as never, order.id)
      .order("scheduled_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    return {
      serviceOrder: order,
      firstVisitBookingId: visit ? String((visit as Record<string, unknown>).id) : null,
    };
  }

  const areas = Array.isArray(proposal.scopeSnapshot.areas)
    ? (proposal.scopeSnapshot.areas as string[])
    : Array.isArray(proposal.scopeSnapshot.checklist)
      ? (proposal.scopeSnapshot.checklist as Array<{ id: string }>).map((c) => c.id)
      : [];
  const agreedChecklist =
    Array.isArray(proposal.scopeSnapshot.checklist) &&
    (proposal.scopeSnapshot.checklist as Array<{ id: string; label: string }>).length > 0
      ? (proposal.scopeSnapshot.checklist as Array<{ id: string; label: string }>)
      : checklistFromAreas(areas);

  const nextVisitAt = nextVisitIso(proposal.firstVisitDate, proposal.frequency);

  const { data: orderRow, error } = await supabase
    .from("service_orders" as never)
    .insert({
      proposal_id: proposal.id,
      business_account_id: proposal.businessAccountId,
      site_address_id: proposal.siteAddressId,
      provider_cleaner_id: proposal.providerCleanerId,
      crew_lead_user_id: proposal.providerUserId,
      status: "active",
      client_price_cents: proposal.clientPriceCents,
      provider_payout_cents: proposal.providerPayoutCents,
      variable_cost_cents: 0,
      frequency: proposal.frequency,
      billing_cadence: proposal.billingCadence,
      scope_snapshot: proposal.scopeSnapshot,
      agreed_checklist: agreedChecklist,
      next_visit_at: nextVisitAt,
    } as never)
    .select("*")
    .single();

  if (error) {
    if (/duplicate|unique|proposal_id/i.test(error.message)) {
      const { data: again } = await supabase
        .from("service_orders" as never)
        .select("*")
        .eq("proposal_id", proposal.id)
        .maybeSingle();
      if (again) {
        return {
          serviceOrder: mapOrder(again as Record<string, unknown>),
          firstVisitBookingId: null,
        };
      }
    }
    throw new Error(error.message);
  }

  const serviceOrder = mapOrder(orderRow as Record<string, unknown>);
  const visitBookingId = await createVisitBookingForOrder({
    order: serviceOrder,
    customerUserId: input.approvedByUserId,
    scheduledAt: nextVisitAt,
    idempotencyKey: `commercial-visit:${serviceOrder.id}:1`,
  });

  return { serviceOrder, firstVisitBookingId: visitBookingId };
}

export async function createVisitBookingForOrder(input: {
  order: ServiceOrder;
  customerUserId: string;
  scheduledAt: string;
  idempotencyKey: string;
}): Promise<string | null> {
  const supabase = createAdminClient();

  const { data: existing } = await supabase
    .from("bookings")
    .select("id")
    .eq("idempotency_key", input.idempotencyKey)
    .maybeSingle();
  if (existing) return String((existing as Record<string, unknown>).id);

  const { data: site } = await supabase
    .from("addresses")
    .select("*")
    .eq("id", input.order.siteAddressId)
    .maybeSingle();
  const siteRow = (site ?? {}) as Record<string, unknown>;

  let professionalProfileId: string | null = null;
  if (input.order.providerCleanerId) {
    const { data: cleaner } = await supabase
      .from("cleaners")
      .select("user_id")
      .eq("id", input.order.providerCleanerId)
      .maybeSingle();
    if (cleaner) {
      professionalProfileId = String((cleaner as Record<string, unknown>).user_id);
    }
  }

  const checklist = input.order.agreedChecklist.map((item) => ({
    id: item.id,
    label: item.label,
    completed: false,
  }));

  const arrival = afterHoursArrivalWindow(input.scheduledAt);

  const { data: booking, error } = await supabase
    .from("bookings")
    .insert({
      customer_id: input.customerUserId,
      address_id: input.order.siteAddressId,
      service_type: "office",
      status: professionalProfileId ? "assigned" : "awaiting_assignment",
      payment_status: "pending",
      scheduled_at: input.scheduledAt,
      arrival_window_start: arrival.start,
      arrival_window_end: arrival.end,
      // Generic only — private entry lives in booking_answers.entryInstructions (not receipts).
      notes: "Commercial service order visit",
      subtotal_cents: input.order.providerPayoutCents,
      platform_fee_cents: Math.max(
        0,
        input.order.clientPriceCents - input.order.providerPayoutCents,
      ),
      fees_cents: Math.max(
        0,
        input.order.clientPriceCents - input.order.providerPayoutCents,
      ),
      tax_cents: 0,
      discount_cents: 0,
      total_cents: input.order.clientPriceCents,
      client_price_cents: input.order.clientPriceCents,
      provider_payout_cents: input.order.providerPayoutCents,
      variable_cost_cents: input.order.variableCostCents,
      currency: "usd",
      idempotency_key: input.idempotencyKey,
      service_order_id: input.order.id,
      professional_profile_id: professionalProfileId,
      cleaner_id: input.order.providerCleanerId,
      job_checklist: checklist,
      address_line1: siteRow.line1 ? String(siteRow.line1) : null,
      address_line2: siteRow.line2 ? String(siteRow.line2) : null,
      address_city: siteRow.city ? String(siteRow.city) : null,
      address_state: siteRow.state ? String(siteRow.state) : null,
      address_postal_code: siteRow.postal_code ? String(siteRow.postal_code) : null,
      address_country: siteRow.country ? String(siteRow.country) : "US",
      address_latitude: siteRow.latitude ?? null,
      address_longitude: siteRow.longitude ?? null,
      booking_answers: {
        commercial: true,
        service_order_id: input.order.id,
        scope: input.order.scopeSnapshot,
      },
    } as never)
    .select("id")
    .single();

  if (error) {
    if (/idempotency|duplicate|unique/i.test(error.message)) {
      const { data: again } = await supabase
        .from("bookings")
        .select("id")
        .eq("idempotency_key", input.idempotencyKey)
        .maybeSingle();
      return again ? String((again as Record<string, unknown>).id) : null;
    }
    throw new Error(error.message);
  }

  if (!professionalProfileId) {
    await openOpsCase({
      caseType: "unfilled_visit",
      businessAccountId: input.order.businessAccountId,
      serviceOrderId: input.order.id,
      bookingId: String((booking as Record<string, unknown>).id),
      summary: "Commercial visit awaiting crew assignment",
    });
  }

  return String((booking as Record<string, unknown>).id);
}

export async function getServiceOrderForBuyer(
  orderId: string,
  userId: string,
): Promise<ServiceOrder | null> {
  if (!hasAdminEnv()) return null;
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("service_orders" as never)
    .select("*")
    .eq("id", orderId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  const order = mapOrder(data as Record<string, unknown>);
  await assertBusinessMember(order.businessAccountId, userId);
  return order;
}

export async function listServiceOrdersForBuyer(userId: string): Promise<ServiceOrder[]> {
  if (!hasAdminEnv()) return [];
  const { getOrCreateBusinessAccountForUser } = await import("@/lib/commercial/acl");
  const account = await getOrCreateBusinessAccountForUser({ userId });
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("service_orders" as never)
    .select("*")
    .eq("business_account_id", account.id)
    .order("updated_at", { ascending: false });
  if (error) {
    if (/service_orders|does not exist|schema cache/i.test(error.message)) return [];
    throw new Error(error.message);
  }
  return (data ?? []).map((r) => mapOrder(r as Record<string, unknown>));
}

export async function assignCrewLead(input: {
  orderId: string;
  providerUserId: string;
  cleanerId: string;
  crewLeadUserId: string;
}): Promise<ServiceOrder> {
  const supabase = createAdminClient();
  const { data: orderRow, error } = await supabase
    .from("service_orders" as never)
    .select("*")
    .eq("id", input.orderId)
    .eq("provider_cleaner_id", input.cleanerId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!orderRow) throw new Error("Service order not found for this provider.");

  const { data: updated, error: updErr } = await supabase
    .from("service_orders" as never)
    .update({
      crew_lead_user_id: input.crewLeadUserId,
      updated_at: new Date().toISOString(),
    } as never)
    .eq("id", input.orderId)
    .select("*")
    .single();
  if (updErr || !updated) throw new Error(updErr?.message ?? "Unable to assign crew.");
  return mapOrder(updated as Record<string, unknown>);
}

export async function cancelServiceOrder(input: {
  orderId: string;
  userId: string;
  reason: string;
}): Promise<ServiceOrder> {
  const order = await getServiceOrderForBuyer(input.orderId, input.userId);
  if (!order) throw new Error("Service order not found.");
  if (order.status === "cancelled") return order;

  const supabase = createAdminClient();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("service_orders" as never)
    .update({
      status: "cancelled",
      cancelled_at: now,
      cancel_reason: input.reason.trim() || "Cancelled by buyer",
      updated_at: now,
    } as never)
    .eq("id", order.id)
    .select("*")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Unable to cancel.");

  // Cancel future open visits for this order.
  await supabase
    .from("bookings")
    .update({ status: "cancelled" } as never)
    .eq("service_order_id" as never, order.id)
    .in("status", [
      "pending_payment",
      "confirmed",
      "awaiting_assignment",
      "offered",
      "assigned",
      "accepted",
    ]);

  await openOpsCase({
    caseType: "cancellation",
    businessAccountId: order.businessAccountId,
    serviceOrderId: order.id,
    summary: `Service order cancelled: ${input.reason.trim() || "no reason"}`,
  });

  return mapOrder(data as Record<string, unknown>);
}

/** Schedule the next visit at the agreed rate (idempotent key per sequence). */
export async function scheduleNextVisitAtAgreedRate(input: {
  orderId: string;
  userId: string;
  sequence: number;
}): Promise<string | null> {
  const order = await getServiceOrderForBuyer(input.orderId, input.userId);
  if (!order) throw new Error("Service order not found.");
  if (order.status !== "active") throw new Error("Order is not active.");
  if (order.frequency === "one_time") {
    throw new Error("One-time orders do not schedule repeats.");
  }

  const base = order.nextVisitAt ?? new Date().toISOString();
  const scheduledAt = advanceNextVisit(base, order.frequency);
  const idempotencyKey = `commercial-visit:${order.id}:${input.sequence}`;

  const visitId = await createVisitBookingForOrder({
    order,
    customerUserId: input.userId,
    scheduledAt,
    idempotencyKey,
  });

  const supabase = createAdminClient();
  await supabase
    .from("service_orders" as never)
    .update({
      next_visit_at: scheduledAt,
      updated_at: new Date().toISOString(),
    } as never)
    .eq("id", order.id);

  return visitId;
}

export function getOrderByIdAdmin(orderId: string): Promise<ServiceOrder | null> {
  return (async () => {
    if (!hasAdminEnv()) return null;
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("service_orders" as never)
      .select("*")
      .eq("id", orderId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) return null;
    return mapOrder(data as Record<string, unknown>);
  })();
}
