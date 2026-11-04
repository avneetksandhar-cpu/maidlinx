/**
 * AI execution gateway — enforces pause, simulation, and GREEN/YELLOW/RED.
 * Foundation: no RED auto-exec; YELLOW recommend-only; GREEN analytics may run.
 */

import {
  canAutoExecute,
  isHardBlockedAction,
  permissionLevelForAction,
  requiresFounderApproval,
} from "@/lib/ai/permissions";
import { isAgentEnabled, isGlobalAiPaused, isSimulationMode } from "@/lib/ai/pause";
import type { AiActionKind, AiAgentId, AiPermissionLevel } from "@/lib/ai/types";

export type AiGateDecision =
  | { allowed: true; level: AiPermissionLevel; mode: "live" | "simulate" }
  | {
      allowed: false;
      level: AiPermissionLevel;
      reason: string;
      code:
        | "global_pause"
        | "agent_paused"
        | "red_requires_approval"
        | "yellow_no_auto"
        | "hard_blocked"
        | "not_green";
    };

export async function assertAiActionAllowed(input: {
  agentId: AiAgentId;
  action: AiActionKind;
  /** When true, YELLOW recommend actions may proceed as recommend-only. */
  recommendOnly?: boolean;
}): Promise<AiGateDecision> {
  const level = permissionLevelForAction(input.action);

  if (await isGlobalAiPaused()) {
    return {
      allowed: false,
      level,
      reason: "Global AI pause is ON.",
      code: "global_pause",
    };
  }

  if (!(await isAgentEnabled(input.agentId))) {
    return {
      allowed: false,
      level,
      reason: `Agent ${input.agentId} is paused or disabled.`,
      code: "agent_paused",
    };
  }

  if (isHardBlockedAction(input.action)) {
    return {
      allowed: false,
      level,
      reason: "Action is hard-blocked in foundation (no autonomy).",
      code: "hard_blocked",
    };
  }

  if (requiresFounderApproval(level)) {
    return {
      allowed: false,
      level,
      reason: "RED actions require founder approval — no autonomy.",
      code: "red_requires_approval",
    };
  }

  if (level === "yellow" && !input.recommendOnly) {
    return {
      allowed: false,
      level,
      reason: "YELLOW actions are recommend-only until explicit approval path.",
      code: "yellow_no_auto",
    };
  }

  if (!canAutoExecute(level) && !input.recommendOnly) {
    return {
      allowed: false,
      level,
      reason: "Action is not GREEN auto-executable.",
      code: "not_green",
    };
  }

  const simulation = await isSimulationMode();
  return {
    allowed: true,
    level,
    mode: simulation ? "simulate" : "live",
  };
}
