/**
 * Load / merge pricing_rules from DB. Falls back to defaults when unavailable.
 * Dynamic pricing remains OFF unless an active rule explicitly enables it.
 */

import { createAdminClient, hasAdminEnv } from "@/lib/supabase/admin";
import { DEFAULT_PRICING_RULES } from "@/lib/pricing/engine/defaults";
import type { DemandSupplySignals, PricingEngineRules } from "@/lib/pricing/engine/types";
import { NEUTRAL_SIGNALS } from "@/lib/pricing/engine/demand-supply";

function mapRules(row: Record<string, unknown>): PricingEngineRules {
  return {
    scope: row.scope === "market" ? "market" : "global",
    marketId: row.market_id ? String(row.market_id) : null,
    dynamicPricingEnabled: Boolean(row.dynamic_pricing_enabled),
    demandMultMin: Number(row.demand_mult_min ?? DEFAULT_PRICING_RULES.demandMultMin),
    demandMultMax: Number(row.demand_mult_max ?? DEFAULT_PRICING_RULES.demandMultMax),
    supplyMultMin: Number(row.supply_mult_min ?? DEFAULT_PRICING_RULES.supplyMultMin),
    supplyMultMax: Number(row.supply_mult_max ?? DEFAULT_PRICING_RULES.supplyMultMax),
    minTotalCents:
      row.min_total_cents != null ? Number(row.min_total_cents) : null,
    maxTotalCents:
      row.max_total_cents != null ? Number(row.max_total_cents) : null,
    minContributionMarginCents: Number(
      row.min_contribution_margin_cents ??
        DEFAULT_PRICING_RULES.minContributionMarginCents,
    ),
    minContributionMarginPct: Number(
      row.min_contribution_margin_pct ??
        DEFAULT_PRICING_RULES.minContributionMarginPct,
    ),
    cleanerHourlyCents: Number(
      row.cleaner_hourly_cents ?? DEFAULT_PRICING_RULES.cleanerHourlyCents,
    ),
    cleanersDefault: Number(
      row.cleaners_default ?? DEFAULT_PRICING_RULES.cleanersDefault,
    ),
    travelBaseCents: Number(
      row.travel_base_cents ?? DEFAULT_PRICING_RULES.travelBaseCents,
    ),
    complexityCentsPerPoint: Number(
      row.complexity_cents_per_point ??
        DEFAULT_PRICING_RULES.complexityCentsPerPoint,
    ),
    recurringWeeklyMult: Number(
      row.recurring_weekly_mult ?? DEFAULT_PRICING_RULES.recurringWeeklyMult,
    ),
    recurringBiweeklyMult: Number(
      row.recurring_biweekly_mult ?? DEFAULT_PRICING_RULES.recurringBiweeklyMult,
    ),
    recurringMonthlyMult: Number(
      row.recurring_monthly_mult ?? DEFAULT_PRICING_RULES.recurringMonthlyMult,
    ),
    leadTimeSameDayMult: Number(
      row.lead_time_same_day_mult ?? DEFAULT_PRICING_RULES.leadTimeSameDayMult,
    ),
    leadTimeNextDayMult: Number(
      row.lead_time_next_day_mult ?? DEFAULT_PRICING_RULES.leadTimeNextDayMult,
    ),
    weekendMult: Number(row.weekend_mult ?? DEFAULT_PRICING_RULES.weekendMult),
    eveningMult: Number(row.evening_mult ?? DEFAULT_PRICING_RULES.eveningMult),
    maxDiscountStackPct: Number(
      row.max_discount_stack_pct ?? DEFAULT_PRICING_RULES.maxDiscountStackPct,
    ),
    params:
      row.params && typeof row.params === "object"
        ? (row.params as Record<string, unknown>)
        : {},
  };
}

/** Merge market rule over global — market can enable dynamic independently. */
export function mergePricingRules(
  global: PricingEngineRules,
  market: PricingEngineRules | null,
): PricingEngineRules {
  if (!market) return global;
  return {
    ...global,
    ...market,
    // Explicit: both must allow? No — market override wins for enable flag.
    dynamicPricingEnabled: market.dynamicPricingEnabled,
    scope: "market",
    marketId: market.marketId,
  };
}

export async function loadPricingRules(
  marketId?: string | null,
): Promise<PricingEngineRules> {
  if (!hasAdminEnv()) {
    return { ...DEFAULT_PRICING_RULES };
  }

  try {
    const supabase = createAdminClient();
    const { data: globalRows, error: globalError } = await supabase
      .from("pricing_rules")
      .select("*")
      .eq("scope", "global")
      .eq("is_active", true)
      .limit(1);

    if (globalError) {
      if (/pricing_rules|schema cache|does not exist/i.test(globalError.message)) {
        return { ...DEFAULT_PRICING_RULES };
      }
      console.error("[pricing_rules] load global failed:", globalError.message);
      return { ...DEFAULT_PRICING_RULES };
    }

    const global = globalRows?.[0]
      ? mapRules(globalRows[0] as Record<string, unknown>)
      : { ...DEFAULT_PRICING_RULES };

    if (!marketId) return global;

    const { data: marketRows, error: marketError } = await supabase
      .from("pricing_rules")
      .select("*")
      .eq("scope", "market")
      .eq("market_id", marketId)
      .eq("is_active", true)
      .limit(1);

    if (marketError || !marketRows?.[0]) return global;
    return mergePricingRules(
      global,
      mapRules(marketRows[0] as Record<string, unknown>),
    );
  } catch (error) {
    console.error(
      "[pricing_rules] unexpected:",
      error instanceof Error ? error.message : error,
    );
    return { ...DEFAULT_PRICING_RULES };
  }
}

export async function loadDemandSupplySignals(
  marketId: string | null | undefined,
  at = new Date(),
): Promise<DemandSupplySignals> {
  if (!marketId || !hasAdminEnv()) return { ...NEUTRAL_SIGNALS };

  try {
    const supabase = createAdminClient();
    const iso = at.toISOString();

    const [{ data: demand }, { data: supply }] = await Promise.all([
      supabase
        .from("market_demand")
        .select("demand_index, source")
        .eq("market_id", marketId)
        .lte("bucket_start", iso)
        .gte("bucket_end", iso)
        .order("bucket_start", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("cleaner_supply")
        .select("supply_index, source")
        .eq("market_id", marketId)
        .lte("bucket_start", iso)
        .gte("bucket_end", iso)
        .order("bucket_start", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    if (!demand && !supply) return { ...NEUTRAL_SIGNALS };

    return {
      demandIndex: demand ? Number(demand.demand_index) : 1,
      supplyIndex: supply ? Number(supply.supply_index) : 1,
      source: (demand?.source ?? supply?.source ?? "computed") as DemandSupplySignals["source"],
    };
  } catch {
    return { ...NEUTRAL_SIGNALS };
  }
}

export async function listAllPricingRules(): Promise<
  Array<PricingEngineRules & { id: string; isActive: boolean; updatedAt: string }>
> {
  if (!hasAdminEnv()) return [];
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("pricing_rules")
    .select("*")
    .order("scope")
    .order("market_id", { nullsFirst: true });

  if (error) {
    if (/pricing_rules|does not exist/i.test(error.message)) return [];
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => {
    const r = row as Record<string, unknown>;
    return {
      id: String(r.id),
      isActive: Boolean(r.is_active),
      updatedAt: String(r.updated_at),
      ...mapRules(r),
    };
  });
}

export async function updatePricingEngineRule(
  adminId: string,
  id: string,
  updates: Partial<{
    dynamicPricingEnabled: boolean;
    demandMultMin: number;
    demandMultMax: number;
    supplyMultMin: number;
    supplyMultMax: number;
    minContributionMarginCents: number;
    minContributionMarginPct: number;
    maxDiscountStackPct: number;
    cleanerHourlyCents: number;
    travelBaseCents: number;
    isActive: boolean;
  }>,
): Promise<void> {
  const supabase = createAdminClient();
  const payload: Record<string, unknown> = { updated_by: adminId };
  if (updates.dynamicPricingEnabled !== undefined) {
    payload.dynamic_pricing_enabled = updates.dynamicPricingEnabled;
  }
  if (updates.demandMultMin !== undefined) payload.demand_mult_min = updates.demandMultMin;
  if (updates.demandMultMax !== undefined) payload.demand_mult_max = updates.demandMultMax;
  if (updates.supplyMultMin !== undefined) payload.supply_mult_min = updates.supplyMultMin;
  if (updates.supplyMultMax !== undefined) payload.supply_mult_max = updates.supplyMultMax;
  if (updates.minContributionMarginCents !== undefined) {
    payload.min_contribution_margin_cents = updates.minContributionMarginCents;
  }
  if (updates.minContributionMarginPct !== undefined) {
    payload.min_contribution_margin_pct = updates.minContributionMarginPct;
  }
  if (updates.maxDiscountStackPct !== undefined) {
    payload.max_discount_stack_pct = updates.maxDiscountStackPct;
  }
  if (updates.cleanerHourlyCents !== undefined) {
    payload.cleaner_hourly_cents = updates.cleanerHourlyCents;
  }
  if (updates.travelBaseCents !== undefined) {
    payload.travel_base_cents = updates.travelBaseCents;
  }
  if (updates.isActive !== undefined) payload.is_active = updates.isActive;

  const { error } = await supabase.from("pricing_rules").update(payload).eq("id", id);
  if (error) throw new Error(error.message);
}
