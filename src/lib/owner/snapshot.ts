/**
 * Owner command center snapshot — real data only; gaps labeled honestly.
 */

import { createAdminClient, hasAdminEnv } from "@/lib/supabase/admin";
import { getPlatformMetrics } from "@/lib/admin/metrics";
import { getAiPauseState } from "@/lib/ai/pause";
import { listOpenAiExceptions } from "@/lib/owner/exceptions";
import { countOpenOpportunities } from "@/lib/owner/opportunities-store";
import { countOpenSalesLeads, countStaleSalesFollowUps } from "@/lib/owner/sales";
import { countFounderInterventionsWeek } from "@/lib/owner/interventions";
import { buildTargetTrackers, type TargetPace, type OwnerRevenueTargets } from "@/lib/owner/targets";

export interface OwnerMetricCell {
  key: string;
  label: string;
  value: string | number | null;
  sublabel?: string;
  available: boolean;
  gapReason?: string;
  isEstimate?: boolean;
}

export interface OwnerSnapshot {
  generatedAt: string;
  revenue: {
    todayCents: number | null;
    weekCents: number | null;
    monthCents: number | null;
    ytdCents: number | null;
    available: boolean;
    gapReason?: string;
  };
  targets: OwnerRevenueTargets;
  monthPace: TargetPace;
  yearPace: TargetPace;
  bookings: {
    all: number | null;
    completed: number | null;
    upcoming: number | null;
    cancelled: number | null;
    available: boolean;
  };
  repeatRatePercent: number | null;
  recurringPreferenceCount: number | null;
  aovCents: number | null;
  estimatedContributionCents: number | null;
  cleaners: {
    total: number | null;
    active: number | null;
    utilizationPct: number | null;
    available: boolean;
  };
  conversion: {
    checkoutStarted: number | null;
    paid: number | null;
    ratePct: number | null;
    available: boolean;
    gapReason?: string;
  };
  abandonedCheckouts: number | null;
  openOpportunities: number | null;
  openLeads: number | null;
  staleFollowUps: number | null;
  openExceptions: number | null;
  founderInterventionsWeek: number | null;
  ai: {
    globalPaused: boolean;
    simulationMode: boolean;
    revenueDirectorEnabled: boolean;
  };
  gaps: string[];
}

function dayStart(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

async function sumCompletedInRange(
  start: Date,
  end: Date,
): Promise<{ cents: number; ok: boolean; reason?: string }> {
  if (!hasAdminEnv()) return { cents: 0, ok: false, reason: "No admin env." };
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("bookings")
    .select("total_cents")
    .eq("status", "completed")
    .gte("completed_at", start.toISOString())
    .lt("completed_at", end.toISOString());
  if (error) return { cents: 0, ok: false, reason: error.message };
  return {
    cents: (data ?? []).reduce(
      (s, r) => s + Number((r as { total_cents: number }).total_cents ?? 0),
      0,
    ),
    ok: true,
  };
}

async function countFunnel(eventNames: string[], since: Date): Promise<{
  count: number;
  ok: boolean;
  reason?: string;
}> {
  if (!hasAdminEnv()) return { count: 0, ok: false, reason: "No admin env." };
  const supabase = createAdminClient();
  const { count, error } = await supabase
    .from("funnel_events")
    .select("*", { count: "exact", head: true })
    .in("event_name", eventNames)
    .gte("created_at", since.toISOString());
  if (error) {
    if (/funnel_events|does not exist|schema cache/i.test(error.message)) {
      return { count: 0, ok: false, reason: "funnel_events unavailable." };
    }
    return { count: 0, ok: false, reason: error.message };
  }
  return { count: count ?? 0, ok: true };
}

async function countRecurringPreference(): Promise<number | null> {
  if (!hasAdminEnv()) return null;
  const supabase = createAdminClient();
  const { count, error } = await supabase
    .from("bookings")
    .select("*" as never, { count: "exact", head: true })
    .in("recurring_preference" as never, ["weekly", "biweekly", "monthly"]);
  if (error) return null;
  return count ?? 0;
}

export async function buildOwnerSnapshot(): Promise<OwnerSnapshot> {
  const gaps: string[] = [];
  const now = new Date();
  const today0 = dayStart(now);
  const tomorrow = new Date(today0);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const weekStart = new Date(today0);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());

  const [
    trackers,
    todayRev,
    weekRev,
    pause,
    platform,
    recurring,
    checkoutStarted,
    abandoned,
    paidFunnel,
    oppCount,
    leadCount,
    staleCount,
    exceptions,
    interventionsWeek,
  ] = await Promise.all([
    buildTargetTrackers(now),
    sumCompletedInRange(today0, tomorrow),
    sumCompletedInRange(weekStart, tomorrow),
    getAiPauseState(),
    hasAdminEnv()
      ? getPlatformMetrics().catch(() => null)
      : Promise.resolve(null),
    countRecurringPreference(),
    countFunnel(["checkout_started"], new Date(Date.now() - 30 * 86_400_000)),
    countFunnel(
      ["booking_abandoned", "funnel_abandoned"],
      new Date(Date.now() - 14 * 86_400_000),
    ),
    countFunnel(
      ["payment_succeeded", "booking_paid"],
      new Date(Date.now() - 30 * 86_400_000),
    ),
    countOpenOpportunities(),
    countOpenSalesLeads(),
    countStaleSalesFollowUps(),
    listOpenAiExceptions(1),
    countFounderInterventionsWeek(),
  ]);

  gaps.push(...trackers.gaps);
  if (!todayRev.ok && todayRev.reason) gaps.push(todayRev.reason);
  if (!weekRev.ok && weekRev.reason) gaps.push(weekRev.reason);
  if (!platform) gaps.push("Platform metrics unavailable.");
  if (!checkoutStarted.ok && checkoutStarted.reason) gaps.push(checkoutStarted.reason);

  const conversionAvailable = checkoutStarted.ok && paidFunnel.ok;
  const conversionRate =
    conversionAvailable && checkoutStarted.count > 0
      ? Math.round((paidFunnel.count / checkoutStarted.count) * 1000) / 10
      : null;

  const utilizationPct =
    platform && platform.totalCleaners > 0
      ? Math.round((platform.activeCleaners / platform.totalCleaners) * 100)
      : null;

  return {
    generatedAt: now.toISOString(),
    revenue: {
      todayCents: todayRev.ok ? todayRev.cents : null,
      weekCents: weekRev.ok ? weekRev.cents : null,
      monthCents: trackers.monthActualAvailable ? trackers.month.actualCents : null,
      ytdCents: trackers.yearActualAvailable ? trackers.year.actualCents : null,
      available: todayRev.ok || trackers.monthActualAvailable,
      gapReason: todayRev.ok ? undefined : todayRev.reason,
    },
    targets: trackers.targets,
    monthPace: trackers.month,
    yearPace: trackers.year,
    bookings: {
      all: platform?.totalBookings ?? null,
      completed: platform?.completedBookings ?? null,
      upcoming: platform?.activeBookings ?? null,
      cancelled: platform?.cancelledBookings ?? null,
      available: !!platform,
    },
    repeatRatePercent: platform?.repeatRatePercent ?? null,
    recurringPreferenceCount: recurring,
    aovCents: platform?.averageOrderValueCents ?? null,
    estimatedContributionCents: platform?.platformMarginCents ?? null,
    cleaners: {
      total: platform?.totalCleaners ?? null,
      active: platform?.activeCleaners ?? null,
      utilizationPct,
      available: !!platform,
    },
    conversion: {
      checkoutStarted: checkoutStarted.ok ? checkoutStarted.count : null,
      paid: paidFunnel.ok ? paidFunnel.count : null,
      ratePct: conversionRate,
      available: conversionAvailable,
      gapReason: conversionAvailable ? undefined : checkoutStarted.reason ?? paidFunnel.reason,
    },
    abandonedCheckouts: abandoned.ok ? abandoned.count : null,
    openOpportunities: oppCount,
    openLeads: leadCount,
    staleFollowUps: staleCount,
    openExceptions: exceptions.count,
    founderInterventionsWeek: interventionsWeek,
    ai: {
      globalPaused: pause.globalPaused,
      simulationMode: pause.simulationMode,
      revenueDirectorEnabled: pause.agents.revenue_director?.enabled ?? false,
    },
    gaps: Array.from(new Set(gaps)),
  };
}
