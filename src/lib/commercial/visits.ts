import { openOpsCase } from "@/lib/commercial/ops";
import type { VisitItemResult, VisitReportItem } from "@/lib/commercial/types";
import { createAdminClient, hasAdminEnv } from "@/lib/supabase/admin";
import { transitionJobStatus } from "@/lib/pro/dashboard/jobs";

function mapItem(row: Record<string, unknown>): VisitReportItem {
  return {
    id: String(row.id),
    bookingId: String(row.booking_id),
    checklistItemId: String(row.checklist_item_id),
    label: String(row.label),
    result: String(row.result) as VisitItemResult,
    missReason: row.miss_reason ? String(row.miss_reason) : null,
  };
}

export async function listVisitReportItems(bookingId: string): Promise<VisitReportItem[]> {
  if (!hasAdminEnv()) return [];
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("visit_report_items" as never)
    .select("*")
    .eq("booking_id", bookingId)
    .order("created_at", { ascending: true });
  if (error) {
    if (/visit_report_items|does not exist|schema cache/i.test(error.message)) return [];
    throw new Error(error.message);
  }
  return (data ?? []).map((r) => mapItem(r as Record<string, unknown>));
}

export async function upsertVisitReportItems(input: {
  bookingId: string;
  profileId: string;
  items: Array<{
    checklistItemId: string;
    label: string;
    result: VisitItemResult;
    missReason?: string | null;
  }>;
}): Promise<VisitReportItem[]> {
  if (!hasAdminEnv()) throw new Error("Database not configured.");
  const supabase = createAdminClient();

  const { data: booking, error: bErr } = await supabase
    .from("bookings")
    .select("id, professional_profile_id, service_order_id, status" as never)
    .eq("id", input.bookingId)
    .maybeSingle();
  if (bErr) throw new Error(bErr.message);
  if (!booking) throw new Error("Visit not found.");
  const row = booking as unknown as Record<string, unknown>;
  if (String(row.professional_profile_id) !== input.profileId) {
    throw new Error("You do not have access to this visit.");
  }

  for (const item of input.items) {
    if (item.result === "missed" && !item.missReason?.trim()) {
      throw new Error(`Missed item "${item.label}" requires a reason.`);
    }
    const { error } = await supabase.from("visit_report_items" as never).upsert(
      {
        booking_id: input.bookingId,
        checklist_item_id: item.checklistItemId,
        label: item.label,
        result: item.result,
        miss_reason: item.result === "missed" ? item.missReason!.trim() : null,
        updated_at: new Date().toISOString(),
      } as never,
      { onConflict: "booking_id,checklist_item_id" },
    );
    if (error) throw new Error(error.message);
  }

  // Mirror completed flags into job_checklist for residential compatibility.
  const checklist = input.items.map((item) => ({
    id: item.checklistItemId,
    label: item.label,
    completed: item.result === "completed",
    missed: item.result === "missed",
    missReason: item.result === "missed" ? item.missReason?.trim() ?? null : null,
  }));
  await supabase
    .from("bookings")
    .update({ job_checklist: checklist } as never)
    .eq("id", input.bookingId);

  return listVisitReportItems(input.bookingId);
}

/**
 * Submit commercial visit report. Allows missed items when reasons recorded.
 * Creates ops case for any misses. Completes booking without requiring all checklist true.
 */
export async function submitCommercialVisitReport(input: {
  bookingId: string;
  profileId: string;
  items: Array<{
    checklistItemId: string;
    label: string;
    result: VisitItemResult;
    missReason?: string | null;
  }>;
}): Promise<{ items: VisitReportItem[]; status: string }> {
  if (input.items.length === 0) {
    throw new Error("Visit report requires checklist items.");
  }
  const unresolved = input.items.filter(
    (i) => i.result === "missed" && !i.missReason?.trim(),
  );
  if (unresolved.length > 0) {
    throw new Error("Record a reason for each missed item before submitting.");
  }

  const items = await upsertVisitReportItems(input);
  const supabase = createAdminClient();

  const { data: booking } = await supabase
    .from("bookings")
    .select(
      "id, status, professional_profile_id, service_order_id, customer_id" as never,
    )
    .eq("id", input.bookingId)
    .maybeSingle();
  if (!booking) throw new Error("Visit not found.");
  const b = booking as unknown as Record<string, unknown>;

  // Mark all checklist completed OR missed so residential completeJob gate can pass
  // for items marked completed; for commercial we bypass via direct status update.
  const now = new Date().toISOString();
  const { error: updErr } = await supabase
    .from("bookings")
    .update({
      status: "completed",
      completed_at: now,
      job_checklist: input.items.map((item) => ({
        id: item.checklistItemId,
        label: item.label,
        completed: item.result === "completed",
        missed: item.result === "missed",
        missReason: item.missReason?.trim() || null,
      })),
    } as never)
    .eq("id", input.bookingId)
    .eq("professional_profile_id", input.profileId)
    .in("status", ["in_progress", "arrived", "on_the_way", "assigned", "accepted"]);

  if (updErr) throw new Error(updErr.message);

  const missed = items.filter((i) => i.result === "missed");
  if (missed.length > 0) {
    let businessAccountId: string | null = null;
    let serviceOrderId = b.service_order_id ? String(b.service_order_id) : null;
    if (serviceOrderId) {
      const { data: order } = await supabase
        .from("service_orders" as never)
        .select("business_account_id")
        .eq("id", serviceOrderId)
        .maybeSingle();
      if (order) {
        businessAccountId = String(
          (order as Record<string, unknown>).business_account_id,
        );
      }
    }
    await openOpsCase({
      caseType: "missed_work",
      businessAccountId,
      serviceOrderId,
      bookingId: input.bookingId,
      summary: `Missed items: ${missed.map((m) => `${m.label} (${m.missReason})`).join("; ")}`,
    });
  }

  // Prefer standard transition when already in_progress with all complete (no misses).
  if (missed.length === 0 && String(b.status) === "in_progress") {
    try {
      await transitionJobStatus(input.bookingId, input.profileId, "completed");
    } catch {
      // already completed above
    }
  }

  return { items, status: "completed" };
}
