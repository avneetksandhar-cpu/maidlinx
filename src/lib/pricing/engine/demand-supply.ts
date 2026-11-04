/**
 * Bounded demand / supply multipliers.
 * Applied only when dynamic pricing is enabled for the resolved rules.
 */

import {
  HARD_DEMAND_MULT_CEILING,
  HARD_DEMAND_MULT_FLOOR,
  HARD_SUPPLY_MULT_CEILING,
  HARD_SUPPLY_MULT_FLOOR,
  clamp,
} from "@/lib/pricing/engine/defaults";
import type { DemandSupplySignals, PricingEngineRules } from "@/lib/pricing/engine/types";

export const NEUTRAL_SIGNALS: DemandSupplySignals = {
  demandIndex: 1,
  supplyIndex: 1,
  source: "default",
};

/**
 * Map demand index (~1 balanced, >1 hot) into [demandMultMin, demandMultMax],
 * then hard-clamp for safety.
 */
export function boundDemandMultiplier(
  demandIndex: number,
  rules: PricingEngineRules,
): number {
  const raw = Number.isFinite(demandIndex) ? demandIndex : 1;
  const softMin = Math.max(HARD_DEMAND_MULT_FLOOR, rules.demandMultMin);
  const softMax = Math.min(HARD_DEMAND_MULT_CEILING, rules.demandMultMax);
  // Center around 1: index 1 → 1; scale gently toward bounds.
  const scaled = 1 + (raw - 1) * 0.5;
  return clamp(scaled, softMin, softMax);
}

/**
 * Low supply → higher multiplier (scarce cleaners); high supply → slight discount.
 */
export function boundSupplyMultiplier(
  supplyIndex: number,
  rules: PricingEngineRules,
): number {
  const raw = Number.isFinite(supplyIndex) && supplyIndex > 0 ? supplyIndex : 1;
  const softMin = Math.max(HARD_SUPPLY_MULT_FLOOR, rules.supplyMultMin);
  const softMax = Math.min(HARD_SUPPLY_MULT_CEILING, rules.supplyMultMax);
  // Inverse: supply 0.5 → bump; supply 1.5 → mild cut.
  const scaled = 1 + (1 - raw) * 0.35;
  return clamp(scaled, softMin, softMax);
}

export function resolveDynamicMultipliers(
  rules: PricingEngineRules,
  signals: DemandSupplySignals,
): { demandMultiplier: number; supplyMultiplier: number; applied: boolean } {
  if (!rules.dynamicPricingEnabled) {
    return { demandMultiplier: 1, supplyMultiplier: 1, applied: false };
  }
  return {
    demandMultiplier: boundDemandMultiplier(signals.demandIndex, rules),
    supplyMultiplier: boundSupplyMultiplier(signals.supplyIndex, rules),
    applied: true,
  };
}
