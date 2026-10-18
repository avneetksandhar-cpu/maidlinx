/**
 * Editable revenue targets — defaults $100K/mo and $1M/yr.
 * Pace + projected month/year-end from real completed revenue.
 */

import { createAdminClient, hasAdminEnv } from "@/lib/supabase/admin";

export const DEFAULT_MONTHLY_TARGET_CENTS = 10_000_000; // $100,000
export const DEFAULT_ANNUAL_TARGET_CENTS = 100_000_000; // $1,000,000

export interface OwnerRevenueTargets {
  monthlyTargetCents: number;
  annualTargetCents: number;
  currency: string;
  notes: string | null;
  updatedAt: string | null;
  source: "db" | "default";
  available: boolean;
  gapReason?: string;
}

export interface TargetPace {
  period: "month" | "year";
  targetCents: number;
  actualCents: number;
  /** Linear pace expected by now (calendar fraction × target). */
  expectedByNowCents: number;
  paceRatio: number | null;
  shortfallOrSurplusCents: number;
  projectedEndCents: number | null;
  daysElapsed: number;
  daysInPeriod: number;
  label: string;
}

function monthBounds(now = new Date()): { start: Date; end: Date; daysInPeriod: number } {
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const daysInPeriod = Math.round((end.getTime() - start.getTime()) / 86_400_000);
  return { start, end, daysInPeriod };
}

function yearBounds(now = new Date()): { start: Date; end: Date; daysInPeriod: number } {
  const start = new Date(now.getFullYear(), 0, 1);
  const end = new Date(now.getFullYear() + 1, 0, 1);
  const daysInPeriod = Math.round((end.getTime() - start.getTime()) / 86_400_000);
  return { start, end, daysInPeriod };
}

function daysElapsed(start: Date, now: Date): number {
  const raw = Math.floor((now.getTime() - start.getTime()) / 86_400_000) + 1;
  return Math.max(1, raw);
}

export function computePace(input: {
  period: "month" | "year";
  targetCents: number;
  actualCents: number;
  now?: Date;
}): TargetPace {
  const now = input.now ?? new Date();
  const bounds = input.period === "month" ? monthBounds(now) : yearBounds(now);
  const elapsed = Math.min(daysElapsed(bounds.start, now), bounds.daysInPeriod);
  const fraction = elapsed / bounds.daysInPeriod;
  const expectedByNowCents = Math.round(input.targetCents * fraction);
  const paceRatio =
    expectedByNowCents > 0 ? input.actualCents / expectedByNowCents : null;
  const projectedEndCents =
    fraction > 0 ? Math.round(input.actualCents / fraction) : null;
  const shortfallOrSurplusCents = input.actualCents - expectedByNowCents;

  return {
    period: input.period,
    targetCents: input.targetCents,
    actualCents: input.actualCents,
    expectedByNowCents,
    paceRatio,
    shortfallOrSurplusCents,
    projectedEndCents,
    daysElapsed: elapsed,
    daysInPeriod: bounds.daysInPeriod,
    label:
      shortfallOrSurplusCents >= 0
        ? `Ahead of pace by $${(shortfallOrSurplusCents / 100).toLocaleString()}`
        : `Behind pace by $${(Math.abs(shortfallOrSurplusCents) / 100).toLocaleString()}`,
  };
}

export async function getOwnerRevenueTargets(): Promise<OwnerRevenueTargets> {
  const fallback: OwnerRevenueTargets = {
    monthlyTargetCents: DEFAULT_MONTHLY_TARGET_CENTS,
    annualTargetCents: DEFAULT_ANNUAL_TARGET_CENTS,
    currency: "usd",
    notes: null,
    updatedAt: null,
    source: "default",
    available: true,
  };

  if (!hasAdminEnv()) {
    return {
      ...fallback,
      available: false,
      gapReason: "Database admin env not configured.",
    };
  }

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("owner_revenue_targets")
      .select(
        "monthly_target_cents, annual_target_cents, currency, notes, updated_at",
      )
      .eq("id", "default")
      .maybeSingle();

    if (error) {
      if (/owner_revenue_targets|does not exist|schema cache/i.test(error.message)) {
        return {
          ...fallback,
          gapReason: "Apply migration 00031 (owner_revenue_targets). Using defaults.",
        };
      }
      return { ...fallback, gapReason: error.message };
    }

    if (!data) return fallback;

    const row = data as {
      monthly_target_cents: number;
      annual_target_cents: number;
      currency: string;
      notes: string | null;
      updated_at: string;
    };

    return {
      monthlyTargetCents: Number(row.monthly_target_cents),
      annualTargetCents: Number(row.annual_target_cents),
      currency: row.currency || "usd",
      notes: row.notes,
      updatedAt: row.updated_at,
      source: "db",
      available: true,
    };
  } catch (err) {
    return {
      ...fallback,
      gapReason: err instanceof Error ? err.message : "Targets read failed.",
    };
  }
}

export async function setOwnerRevenueTargets(input: {
  monthlyTargetCents: number;
  annualTargetCents: number;
  notes?: string | null;
  updatedByProfileId?: string | null;
}): Promise<{ ok: boolean; reason?: string }> {
  if (!hasAdminEnv()) return { ok: false, reason: "Database not configured." };
  if (input.monthlyTargetCents < 0 || input.annualTargetCents < 0) {
    return { ok: false, reason: "Targets must be non-negative." };
  }

  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("owner_revenue_targets").upsert(
      {
        id: "default",
        monthly_target_cents: Math.round(input.monthlyTargetCents),
        annual_target_cents: Math.round(input.annualTargetCents),
        notes: input.notes ?? null,
        updated_by_profile_id: input.updatedByProfileId ?? null,
        updated_at: new Date().toISOString(),
      } as never,
      { onConflict: "id" },
    );

    if (error) {
      if (/owner_revenue_targets|does not exist|schema cache/i.test(error.message)) {
        return { ok: false, reason: "Apply migration 00031." };
      }
      return { ok: false, reason: error.message };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, reason: err instanceof Error ? err.message : "Update failed." };
  }
}

export async function sumCompletedRevenueCents(range: {
  startIso: string;
  endIso: string;
}): Promise<{ cents: number; available: boolean; gapReason?: string }> {
  if (!hasAdminEnv()) {
    return { cents: 0, available: false, gapReason: "Database not configured." };
  }
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("bookings")
      .select("total_cents")
      .eq("status", "completed")
      .gte("completed_at", range.startIso)
      .lt("completed_at", range.endIso);

    if (error) {
      return { cents: 0, available: false, gapReason: error.message };
    }
    const cents = (data ?? []).reduce(
      (sum, row) => sum + Number((row as { total_cents: number }).total_cents ?? 0),
      0,
    );
    return { cents, available: true };
  } catch (err) {
    return {
      cents: 0,
      available: false,
      gapReason: err instanceof Error ? err.message : "Revenue sum failed.",
    };
  }
}

export async function buildTargetTrackers(now = new Date()): Promise<{
  targets: OwnerRevenueTargets;
  month: TargetPace;
  year: TargetPace;
  monthActualAvailable: boolean;
  yearActualAvailable: boolean;
  gaps: string[];
}> {
  const targets = await getOwnerRevenueTargets();
  const m = monthBounds(now);
  const y = yearBounds(now);
  const [monthRev, yearRev] = await Promise.all([
    sumCompletedRevenueCents({
      startIso: m.start.toISOString(),
      endIso: m.end.toISOString(),
    }),
    sumCompletedRevenueCents({
      startIso: y.start.toISOString(),
      endIso: y.end.toISOString(),
    }),
  ]);

  const gaps: string[] = [];
  if (targets.gapReason) gaps.push(targets.gapReason);
  if (monthRev.gapReason) gaps.push(monthRev.gapReason);
  if (yearRev.gapReason) gaps.push(yearRev.gapReason);

  return {
    targets,
    month: computePace({
      period: "month",
      targetCents: targets.monthlyTargetCents,
      actualCents: monthRev.cents,
      now,
    }),
    year: computePace({
      period: "year",
      targetCents: targets.annualTargetCents,
      actualCents: yearRev.cents,
      now,
    }),
    monthActualAvailable: monthRev.available,
    yearActualAvailable: yearRev.available,
    gaps,
  };
}
