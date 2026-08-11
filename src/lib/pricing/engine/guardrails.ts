/**
 * Profit guardrail — never quote below minimum contribution margin.
 * Runs before a quote is issued; raises customer total if needed.
 */

import type { PricingEngineRules } from "@/lib/pricing/engine/types";

export interface GuardrailInput {
  totalCents: number;
  costEstimateCents: number;
  rules: PricingEngineRules;
}

export interface GuardrailResult {
  totalCents: number;
  contributionMarginCents: number;
  contributionMarginPct: number;
  applied: boolean;
  reason: string | null;
}

export function enforceMinContributionMargin(input: GuardrailInput): GuardrailResult {
  const cost = Math.max(0, Math.floor(input.costEstimateCents));
  let total = Math.max(0, Math.floor(input.totalCents));

  const minByCents = cost + input.rules.minContributionMarginCents;
  const minByPct =
    cost + Math.ceil((cost * input.rules.minContributionMarginPct) / 100);
  const floor = Math.max(minByCents, minByPct);

  let applied = false;
  let reason: string | null = null;

  if (total < floor) {
    total = floor;
    applied = true;
    reason = "Raised total to satisfy minimum contribution margin.";
  }

  if (input.rules.minTotalCents != null && total < input.rules.minTotalCents) {
    total = input.rules.minTotalCents;
    applied = true;
    reason = reason ?? "Raised total to configured minimum.";
  }

  if (input.rules.maxTotalCents != null && total > input.rules.maxTotalCents) {
    // Cap never violates margin floor — prefer floor over max if conflict.
    total = Math.max(floor, input.rules.maxTotalCents);
    applied = true;
    reason = reason ?? "Capped total to configured maximum.";
  }

  const contributionMarginCents = total - cost;
  const contributionMarginPct =
    total > 0 ? (contributionMarginCents / total) * 100 : 0;

  return {
    totalCents: total,
    contributionMarginCents,
    contributionMarginPct,
    applied,
    reason,
  };
}

/**
 * Reject a proposed discount that would push margin below the floor.
 * Returns the maximum allowable discount cents.
 */
export function maxAllowableDiscountCents(input: {
  subtotalCents: number;
  platformFeeCents: number;
  taxCents: number;
  costEstimateCents: number;
  proposedDiscountCents: number;
  rules: PricingEngineRules;
}): number {
  const proposed = Math.max(0, Math.floor(input.proposedDiscountCents));
  const preDiscount =
    input.subtotalCents + input.platformFeeCents + input.taxCents;
  const after = enforceMinContributionMargin({
    totalCents: preDiscount - proposed,
    costEstimateCents: input.costEstimateCents,
    rules: input.rules,
  });
  // If guardrail raised the total, shrink discount accordingly.
  const maxDiscount = Math.max(0, preDiscount - after.totalCents);
  return Math.min(proposed, maxDiscount);
}
