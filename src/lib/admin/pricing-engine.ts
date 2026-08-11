/**
 * Admin pricing engine metrics — real aggregates only (empty when no data).
 */

import { createAdminClient, hasAdminEnv } from "@/lib/supabase/admin";

export interface PricingEngineMetrics {
  quotesLast7d: number;
  quotesWithGuardrailLast7d: number;
  quotesDynamicLast7d: number;
  avgContributionMarginCents: number | null;
  avgTotalCents: number | null;
  funnelEventsLast7d: number;
  experimentsRunning: number;
  dynamicPricingEnabledGlobal: boolean | null;
}

export const EMPTY_PRICING_ENGINE_METRICS: PricingEngineMetrics = {
  quotesLast7d: 0,
  quotesWithGuardrailLast7d: 0,
  quotesDynamicLast7d: 0,
  avgContributionMarginCents: null,
  avgTotalCents: null,
  funnelEventsLast7d: 0,
  experimentsRunning: 0,
  dynamicPricingEnabledGlobal: false,
};

export async function getPricingEngineMetrics(): Promise<PricingEngineMetrics> {
  if (!hasAdminEnv()) {
    return { ...EMPTY_PRICING_ENGINE_METRICS };
  }

  const supabase = createAdminClient();
  const since = new Date(Date.now() - 7 * 86_400_000).toISOString();

  try {
    const [quotesRes, funnelRes, expRes, rulesRes] = await Promise.all([
      supabase
        .from("pricing_quotes")
        .select(
          "total_cents, contribution_margin_cents, guardrail_applied, dynamic_pricing_applied",
        )
        .gte("created_at", since),
      supabase
        .from("funnel_events")
        .select("id", { count: "exact", head: true })
        .gte("created_at", since),
      supabase
        .from("pricing_experiments")
        .select("id", { count: "exact", head: true })
        .eq("status", "running"),
      supabase
        .from("pricing_rules")
        .select("dynamic_pricing_enabled")
        .eq("scope", "global")
        .eq("is_active", true)
        .limit(1)
        .maybeSingle(),
    ]);

    if (quotesRes.error && /pricing_quotes|does not exist/i.test(quotesRes.error.message)) {
      return { ...EMPTY_PRICING_ENGINE_METRICS };
    }

    const quotes = quotesRes.data ?? [];
    const totals = quotes.map((q) => Number((q as { total_cents: number }).total_cents));
    const margins = quotes.map((q) =>
      Number((q as { contribution_margin_cents: number }).contribution_margin_cents),
    );

    return {
      quotesLast7d: quotes.length,
      quotesWithGuardrailLast7d: quotes.filter(
        (q) => Boolean((q as { guardrail_applied: boolean }).guardrail_applied),
      ).length,
      quotesDynamicLast7d: quotes.filter(
        (q) => Boolean((q as { dynamic_pricing_applied: boolean }).dynamic_pricing_applied),
      ).length,
      avgContributionMarginCents:
        margins.length > 0
          ? Math.round(margins.reduce((a, b) => a + b, 0) / margins.length)
          : null,
      avgTotalCents:
        totals.length > 0
          ? Math.round(totals.reduce((a, b) => a + b, 0) / totals.length)
          : null,
      funnelEventsLast7d: funnelRes.count ?? 0,
      experimentsRunning: expRes.count ?? 0,
      dynamicPricingEnabledGlobal: rulesRes.data
        ? Boolean(
            (rulesRes.data as { dynamic_pricing_enabled: boolean })
              .dynamic_pricing_enabled,
          )
        : false,
    };
  } catch {
    return { ...EMPTY_PRICING_ENGINE_METRICS };
  }
}
