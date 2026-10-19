/**
 * Smart scheduling capacity labels — real capacity only.
 * Never invents "limited" scarcity for dark-pattern conversion.
 */

import {
  forecastCapacity,
  type CapacityValue,
} from "@/lib/brain/forecasts";
import type { ForecastResult } from "@/lib/brain/types";

export type SchedulingLabel =
  | { kind: "INSUFFICIENT_DATA"; message: string }
  | { kind: "label"; code: CapacityValue["label"]; message: string };

const MESSAGES: Record<CapacityValue["label"], string> = {
  plenty: "Good availability in this market.",
  balanced: "Typical availability.",
  tight: "Limited cleaner capacity — book earlier if flexible.",
  overbooked: "High demand relative to active cleaners.",
};

export async function schedulingCapacityLabel(input: {
  marketId: string;
}): Promise<SchedulingLabel> {
  const capacity: ForecastResult<CapacityValue> = await forecastCapacity({
    marketId: input.marketId,
    horizon: "next_7d",
  });

  if (capacity.status === "INSUFFICIENT_DATA" || !capacity.value) {
    return {
      kind: "INSUFFICIENT_DATA",
      message: "Availability will confirm after more booking history.",
    };
  }

  return {
    kind: "label",
    code: capacity.value.label,
    message: MESSAGES[capacity.value.label],
  };
}
