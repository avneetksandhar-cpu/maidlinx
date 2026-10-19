/**
 * Smart discount stacking with max stack % and profit guardrail.
 * Referral credits stay gated when not live.
 */

import { maxAllowableDiscountCents } from "@/lib/pricing/engine/guardrails";
import type { DiscountLine, PricingEngineRules } from "@/lib/pricing/engine/types";

export interface StackDiscountsInput {
  subtotalCents: number;
  platformFeeCents: number;
  taxCents?: number;
  costEstimateCents: number;
  rules: PricingEngineRules;
  lines: DiscountLine[];
}

export interface StackDiscountsResult {
  lines: DiscountLine[];
  totalDiscountCents: number;
  capped: boolean;
  rejectedBelowMargin: boolean;
}

/**
 * Apply discounts in priority order: promo → recurring → experiment → referral → other.
 * Cap by maxDiscountStackPct of subtotal, then by contribution margin floor.
 */
export function stackDiscounts(input: StackDiscountsInput): StackDiscountsResult {
  const priority: Record<DiscountLine["type"], number> = {
    promo: 1,
    recurring: 2,
    experiment: 3,
    referral: 4,
    other: 5,
  };

  const sorted = [...input.lines]
    .filter((l) => l.amountCents > 0)
    .sort((a, b) => priority[a.type] - priority[b.type]);

  const maxByPct = Math.floor(
    (input.subtotalCents * input.rules.maxDiscountStackPct) / 100,
  );

  const applied: DiscountLine[] = [];
  let running = 0;
  let capped = false;

  for (const line of sorted) {
    const room = Math.max(0, maxByPct - running);
    if (room <= 0) {
      capped = true;
      break;
    }
    const take = Math.min(line.amountCents, room, input.subtotalCents - running);
    if (take <= 0) {
      capped = true;
      continue;
    }
    if (take < line.amountCents) capped = true;
    applied.push({ ...line, amountCents: take });
    running += take;
  }

  const allowable = maxAllowableDiscountCents({
    subtotalCents: input.subtotalCents,
    platformFeeCents: input.platformFeeCents,
    taxCents: input.taxCents ?? 0,
    costEstimateCents: input.costEstimateCents,
    proposedDiscountCents: running,
    rules: input.rules,
  });

  let rejectedBelowMargin = false;
  if (allowable < running) {
    rejectedBelowMargin = true;
    // Trim from the end of the stack (lowest priority first).
    let need = running - allowable;
    for (let i = applied.length - 1; i >= 0 && need > 0; i -= 1) {
      const line = applied[i]!;
      const cut = Math.min(line.amountCents, need);
      line.amountCents -= cut;
      need -= cut;
      running -= cut;
    }
    const kept = applied.filter((l) => l.amountCents > 0);
    applied.length = 0;
    applied.push(...kept);
  }

  return {
    lines: applied,
    totalDiscountCents: Math.max(0, running),
    capped: capped || rejectedBelowMargin,
    rejectedBelowMargin,
  };
}
