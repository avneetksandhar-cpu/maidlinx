import { createAdminClient, hasAdminEnv } from "@/lib/supabase/admin";
import {
  normalizeOpsMarketKey,
  opsMarketLabel,
  OPS_MARKETS,
  type OpsMarketKey,
} from "@/lib/admin/market-ids";
import { normalizeBookingStatus } from "@/lib/bookings/status";

export interface TodayStatusCounts {
  bookings: number;
  revenueCents: number;
  awaitingAssignment: number;
  assigned: number;
  inProgress: number;
  completed: number;
  cancelled: number;
  cleanerAvailable: number;
}

export interface MarketTodayMetrics extends TodayStatusCounts {
  marketKey: OpsMarketKey | "unassigned";
  marketLabel: string;
}

export interface OpsDashboardMetrics {
  today: TodayStatusCounts;
  byMarket: MarketTodayMetrics[];
  cleanerAvailability: {
    active: number;
    availableToday: number;
    onJob: number;
  };
}

export const EMPTY_TODAY_COUNTS: TodayStatusCounts = {
  bookings: 0,
  revenueCents: 0,
  awaitingAssignment: 0,
  assigned: 0,
  inProgress: 0,
  completed: 0,
  cancelled: 0,
  cleanerAvailable: 0,
};

export const EMPTY_OPS_DASHBOARD: OpsDashboardMetrics = {
  today: { ...EMPTY_TODAY_COUNTS },
  byMarket: OPS_MARKETS.map((m) => ({
    marketKey: m.key,
    marketLabel: m.label,
    ...EMPTY_TODAY_COUNTS,
  })),
  cleanerAvailability: { active: 0, availableToday: 0, onJob: 0 },
};

function todayBounds(): { start: string; end: string; weekday: number } {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start: start.toISOString(), end: end.toISOString(), weekday: start.getDay() };
}

function emptyMarketBucket(key: OpsMarketKey | "unassigned"): MarketTodayMetrics {
  return {
    marketKey: key,
    marketLabel: opsMarketLabel(key),
    ...EMPTY_TODAY_COUNTS,
  };
}

export async function getOpsDashboardMetrics(): Promise<OpsDashboardMetrics> {
  if (!hasAdminEnv()) {
    return structuredClone(EMPTY_OPS_DASHBOARD);
  }

  const supabase = createAdminClient();
  const { start, end, weekday } = todayBounds();

  const [
    bookingsRes,
    completedRevenueRes,
    activeCleanersRes,
    availabilityRes,
    onJobRes,
  ] = await Promise.all([
    supabase
      .from("bookings")
      .select("id, status, market_id, total_cents, scheduled_at, completed_at, cancelled_at")
      .or(
        `and(scheduled_at.gte.${start},scheduled_at.lt.${end}),and(completed_at.gte.${start},completed_at.lt.${end}),and(cancelled_at.gte.${start},cancelled_at.lt.${end})`,
      )
      .limit(2000),
    supabase
      .from("bookings")
      .select("total_cents, market_id")
      .eq("status", "completed")
      .gte("completed_at", start)
      .lt("completed_at", end),
    supabase
      .from("professionals")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true),
    supabase
      .from("professional_availability")
      .select("professional_profile_id, is_available")
      .eq("day_of_week", weekday)
      .eq("is_available", true),
    supabase
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .in("status", ["assigned", "accepted", "on_the_way", "arrived", "in_progress"])
      .gte("scheduled_at", start)
      .lt("scheduled_at", end),
  ]);

  const buckets = new Map<OpsMarketKey | "unassigned", MarketTodayMetrics>();
  for (const m of OPS_MARKETS) {
    buckets.set(m.key, emptyMarketBucket(m.key));
  }
  buckets.set("unassigned", emptyMarketBucket("unassigned"));

  const today = { ...EMPTY_TODAY_COUNTS };
  const seenBookingIds = new Set<string>();

  for (const row of bookingsRes.data ?? []) {
    const r = row as Record<string, unknown>;
    const id = String(r.id);
    if (seenBookingIds.has(id)) continue;
    seenBookingIds.add(id);

    const status = String(normalizeBookingStatus(String(r.status)));
    const marketKey = normalizeOpsMarketKey(r.market_id ? String(r.market_id) : null);
    const bucket = buckets.get(marketKey) ?? emptyMarketBucket(marketKey);
    buckets.set(marketKey, bucket);

    const scheduledAt = r.scheduled_at ? String(r.scheduled_at) : null;
    const isScheduledToday =
      scheduledAt != null && scheduledAt >= start && scheduledAt < end;

    if (isScheduledToday) {
      today.bookings += 1;
      bucket.bookings += 1;

      if (status === "awaiting_assignment" || status === "confirmed" || status === "offered") {
        today.awaitingAssignment += 1;
        bucket.awaitingAssignment += 1;
      }
      if (status === "assigned" || status === "accepted") {
        today.assigned += 1;
        bucket.assigned += 1;
      }
      if (
        status === "on_the_way" ||
        status === "arrived" ||
        status === "in_progress"
      ) {
        today.inProgress += 1;
        bucket.inProgress += 1;
      }
      if (status === "completed") {
        today.completed += 1;
        bucket.completed += 1;
      }
      if (status === "cancelled") {
        today.cancelled += 1;
        bucket.cancelled += 1;
      }
    } else {
      // Capture completions/cancellations that finished today but weren't scheduled today.
      if (status === "completed") {
        const completedAt = r.completed_at ? String(r.completed_at) : "";
        if (completedAt >= start && completedAt < end) {
          today.completed += 1;
          bucket.completed += 1;
        }
      }
      if (status === "cancelled") {
        const cancelledAt = r.cancelled_at ? String(r.cancelled_at) : "";
        if (cancelledAt >= start && cancelledAt < end) {
          today.cancelled += 1;
          bucket.cancelled += 1;
        }
      }
    }
  }

  for (const row of completedRevenueRes.data ?? []) {
    const r = row as Record<string, unknown>;
    const cents = Number(r.total_cents ?? 0);
    const marketKey = normalizeOpsMarketKey(r.market_id ? String(r.market_id) : null);
    today.revenueCents += cents;
    const bucket = buckets.get(marketKey) ?? emptyMarketBucket(marketKey);
    bucket.revenueCents += cents;
    buckets.set(marketKey, bucket);
  }

  const availableProfileIds = new Set(
    (availabilityRes.data ?? []).map((row) =>
      String((row as { professional_profile_id: string }).professional_profile_id),
    ),
  );

  today.cleanerAvailable = availableProfileIds.size;
  for (const bucket of buckets.values()) {
    // Availability isn't market-tagged yet — show platform total on each market card as 0
    // except we surface the global number on the main cleaner availability block.
    bucket.cleanerAvailable = 0;
  }

  const byMarket = [
    ...OPS_MARKETS.map((m) => buckets.get(m.key) ?? emptyMarketBucket(m.key)),
    ...(buckets.get("unassigned")!.bookings > 0 ||
    buckets.get("unassigned")!.revenueCents > 0 ||
    buckets.get("unassigned")!.completed > 0 ||
    buckets.get("unassigned")!.cancelled > 0
      ? [buckets.get("unassigned")!]
      : []),
  ];

  return {
    today,
    byMarket,
    cleanerAvailability: {
      active: activeCleanersRes.count ?? 0,
      availableToday: availableProfileIds.size,
      onJob: onJobRes.count ?? 0,
    },
  };
}
