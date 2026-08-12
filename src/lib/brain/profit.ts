/**
 * Job profitability — estimated vs actual.
 * Never auto-refunds or auto-adjusts payouts.
 */

import { createAdminClient, hasAdminEnv } from "@/lib/supabase/admin";
import { BRAIN_MIN_SAMPLE_SIZE } from "@/lib/brain/types";

export interface ProfitSnapshot {
  bookingId: string;
  estimatedRevenueCents: number;
  estimatedCostCents: number;
  estimatedMarginCents: number;
  actualRevenueCents: number | null;
  actualCostCents: number | null;
  actualMarginCents: number | null;
  status: "estimated" | "actualized" | "void";
}

export async function upsertEstimatedProfit(input: {
  bookingId: string;
  marketId?: string | null;
  revenueCents: number;
  costCents: number;
}): Promise<void> {
  if (!hasAdminEnv()) return;
  const margin = input.revenueCents - input.costCents;
  const supabase = createAdminClient();
  await supabase.from("brain_job_profit").upsert(
    {
      booking_id: input.bookingId,
      market_id: input.marketId ?? null,
      estimated_revenue_cents: input.revenueCents,
      estimated_cost_cents: input.costCents,
      estimated_margin_cents: margin,
      status: "estimated",
    } as never,
    { onConflict: "booking_id" },
  );
}

export async function actualizeProfitFromBooking(bookingId: string): Promise<void> {
  if (!hasAdminEnv()) return;
  const supabase = createAdminClient();
  const { data: booking } = await supabase
    .from("bookings")
    .select("id, total_cents, platform_fee_cents, status, market_id")
    .eq("id", bookingId)
    .maybeSingle();

  if (!booking || String(booking.status) !== "completed") return;

  const revenue = Number(booking.total_cents ?? 0);
  const platformFee = Number(booking.platform_fee_cents ?? 0);
  // Cleaner cost estimate = revenue - platform fee when payout ledger absent.
  const cost = Math.max(0, revenue - platformFee);
  const margin = revenue - cost;

  await supabase.from("brain_job_profit").upsert(
    {
      booking_id: bookingId,
      market_id: booking.market_id ? String(booking.market_id) : null,
      estimated_revenue_cents: revenue,
      estimated_cost_cents: cost,
      estimated_margin_cents: margin,
      actual_revenue_cents: revenue,
      actual_cost_cents: cost,
      actual_margin_cents: margin,
      status: "actualized",
    } as never,
    { onConflict: "booking_id" },
  );
}

export async function profitDashboardSummary(): Promise<{
  status: "ok" | "INSUFFICIENT_DATA";
  sampleSize: number;
  estimatedMarginCents: number;
  actualMarginCents: number;
  avgMarginPct: number | null;
}> {
  if (!hasAdminEnv()) {
    return {
      status: "INSUFFICIENT_DATA",
      sampleSize: 0,
      estimatedMarginCents: 0,
      actualMarginCents: 0,
      avgMarginPct: null,
    };
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("brain_job_profit")
    .select(
      "estimated_margin_cents, actual_margin_cents, actual_revenue_cents, status",
    )
    .limit(500);

  if (error || !data || data.length === 0) {
    return {
      status: "INSUFFICIENT_DATA",
      sampleSize: 0,
      estimatedMarginCents: 0,
      actualMarginCents: 0,
      avgMarginPct: null,
    };
  }

  const sampleSize = data.length;
  const estimatedMarginCents = data.reduce(
    (s, r) => s + Number(r.estimated_margin_cents ?? 0),
    0,
  );
  const actualized = data.filter((r) => r.status === "actualized");
  const actualMarginCents = actualized.reduce(
    (s, r) => s + Number(r.actual_margin_cents ?? 0),
    0,
  );
  const actualRevenue = actualized.reduce(
    (s, r) => s + Number(r.actual_revenue_cents ?? 0),
    0,
  );

  return {
    status: sampleSize >= BRAIN_MIN_SAMPLE_SIZE ? "ok" : "INSUFFICIENT_DATA",
    sampleSize,
    estimatedMarginCents,
    actualMarginCents,
    avgMarginPct:
      actualRevenue > 0
        ? Number(((actualMarginCents / actualRevenue) * 100).toFixed(2))
        : null,
  };
}
