/**
 * Demand / supply / capacity forecasts — deterministic historical aggregates.
 * Returns INSUFFICIENT_DATA when sample size is below BRAIN_MIN_SAMPLE_SIZE.
 * Only counts approved/active cleaners as supply (applicants ≠ supply).
 */

import { createAdminClient, hasAdminEnv } from "@/lib/supabase/admin";
import {
  BRAIN_MIN_SAMPLE_SIZE,
  confidenceFromSample,
  type ForecastResult,
} from "@/lib/brain/types";

export interface DemandValue {
  forecastedJobs: number;
  historicalAvgJobs: number;
  windowDays: number;
}

export interface SupplyValue {
  eligibleCleaners: number;
  activeCleaners: number;
  onlineCleaners: number;
}

export interface CapacityValue {
  demandJobs: number;
  supplyCleaners: number;
  utilizationRatio: number;
  label: "plenty" | "balanced" | "tight" | "overbooked";
}

function horizonDays(horizon: ForecastResult<unknown>["horizon"]): number {
  if (horizon === "next_24h") return 1;
  if (horizon === "next_7d") return 7;
  return 30;
}

function lookbackDays(horizon: ForecastResult<unknown>["horizon"]): number {
  if (horizon === "next_24h") return 28;
  if (horizon === "next_7d") return 56;
  return 90;
}

export async function forecastDemand(input: {
  marketId: string;
  horizon?: ForecastResult<unknown>["horizon"];
}): Promise<ForecastResult<DemandValue>> {
  const horizon = input.horizon ?? "next_7d";
  const empty: ForecastResult<DemandValue> = {
    status: "INSUFFICIENT_DATA",
    sampleSize: 0,
    confidence: 0,
    marketId: input.marketId,
    horizon,
    value: null,
    reason: "Database not configured or no history.",
  };

  if (!hasAdminEnv()) return empty;

  const supabase = createAdminClient();
  const days = lookbackDays(horizon);
  const since = new Date();
  since.setDate(since.getDate() - days);

  let query = supabase
    .from("bookings")
    .select("id, scheduled_at, status, market_id")
    .gte("scheduled_at", since.toISOString())
    .not("status", "eq", "draft");

  if (input.marketId && input.marketId !== "all") {
    query = query.eq("market_id", input.marketId);
  }

  const { data, error } = await query;
  if (error) {
    return { ...empty, reason: error.message };
  }

  const rows = data ?? [];
  const sampleSize = rows.length;
  if (sampleSize < BRAIN_MIN_SAMPLE_SIZE) {
    return {
      status: "INSUFFICIENT_DATA",
      sampleSize,
      confidence: 0,
      marketId: input.marketId,
      horizon,
      value: null,
      reason: `Need at least ${BRAIN_MIN_SAMPLE_SIZE} historical bookings; have ${sampleSize}.`,
    };
  }

  const avgPerDay = sampleSize / days;
  const forecastedJobs = Math.round(avgPerDay * horizonDays(horizon));

  return {
    status: "ok",
    sampleSize,
    confidence: confidenceFromSample(sampleSize),
    marketId: input.marketId,
    horizon,
    value: {
      forecastedJobs,
      historicalAvgJobs: Number(avgPerDay.toFixed(2)),
      windowDays: days,
    },
  };
}

export async function forecastSupply(input: {
  marketId: string;
  horizon?: ForecastResult<unknown>["horizon"];
}): Promise<ForecastResult<SupplyValue>> {
  const horizon = input.horizon ?? "next_7d";
  const empty: ForecastResult<SupplyValue> = {
    status: "INSUFFICIENT_DATA",
    sampleSize: 0,
    confidence: 0,
    marketId: input.marketId,
    horizon,
    value: null,
    reason: "Database not configured or no eligible cleaners.",
  };

  if (!hasAdminEnv()) return empty;

  const supabase = createAdminClient();
  // Applicants ≠ supply: require active + approved/verified.
  let query = supabase
    .from("cleaners")
    .select("id, is_active, is_online, approved, is_verified, onboarding_status, market_id, maidlinx_verified")
    .eq("is_active", true);

  if (input.marketId && input.marketId !== "all") {
    query = query.eq("market_id", input.marketId);
  }

  const { data, error } = await query;
  if (error) {
    return { ...empty, reason: error.message };
  }

  const rows = (data ?? []) as Record<string, unknown>[];
  const eligible = rows.filter((r) => {
    const approved =
      Boolean(r.approved) ||
      Boolean(r.is_verified) ||
      String(r.onboarding_status ?? "") === "APPROVED" ||
      Boolean(r.maidlinx_verified);
    return approved;
  });

  const sampleSize = eligible.length;
  if (sampleSize < 1) {
    return {
      status: "INSUFFICIENT_DATA",
      sampleSize: 0,
      confidence: 0,
      marketId: input.marketId,
      horizon,
      value: null,
      reason: "No approved/active cleaners in market.",
    };
  }

  const online = eligible.filter((r) => r.is_online === true).length;

  return {
    status: "ok",
    sampleSize,
    confidence: confidenceFromSample(Math.max(sampleSize, BRAIN_MIN_SAMPLE_SIZE)),
    marketId: input.marketId,
    horizon,
    value: {
      eligibleCleaners: sampleSize,
      activeCleaners: sampleSize,
      onlineCleaners: online,
    },
  };
}

export function capacityLabelFromRatio(ratio: number): CapacityValue["label"] {
  if (ratio < 0.5) return "plenty";
  if (ratio < 0.85) return "balanced";
  if (ratio < 1.1) return "tight";
  return "overbooked";
}

export async function forecastCapacity(input: {
  marketId: string;
  horizon?: ForecastResult<unknown>["horizon"];
}): Promise<ForecastResult<CapacityValue>> {
  const horizon = input.horizon ?? "next_7d";
  const [demand, supply] = await Promise.all([
    forecastDemand({ marketId: input.marketId, horizon }),
    forecastSupply({ marketId: input.marketId, horizon }),
  ]);

  if (demand.status === "INSUFFICIENT_DATA" || supply.status === "INSUFFICIENT_DATA") {
    return {
      status: "INSUFFICIENT_DATA",
      sampleSize: Math.min(demand.sampleSize, supply.sampleSize),
      confidence: 0,
      marketId: input.marketId,
      horizon,
      value: null,
      reason: demand.reason ?? supply.reason,
    };
  }

  const demandJobs = demand.value!.forecastedJobs;
  const supplyCleaners = Math.max(1, supply.value!.eligibleCleaners);
  // Rough jobs-per-cleaner capacity over horizon (2 jobs/day heuristic, ops-reviewable).
  const capacityJobs = supplyCleaners * horizonDays(horizon) * 2;
  const ratio = demandJobs / capacityJobs;
  const label = capacityLabelFromRatio(ratio);

  return {
    status: "ok",
    sampleSize: demand.sampleSize,
    confidence: Math.min(demand.confidence, supply.confidence),
    marketId: input.marketId,
    horizon,
    value: {
      demandJobs,
      supplyCleaners,
      utilizationRatio: Number(ratio.toFixed(3)),
      label,
    },
  };
}
