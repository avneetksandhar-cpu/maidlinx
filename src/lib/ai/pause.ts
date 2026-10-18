/**
 * Global + per-agent AI pause. Backed by ai_feature_flags.
 */

import type { AiAgentId } from "@/lib/ai/types";
import {
  agentFlagKey,
  getAiFlag,
  listAiFeatureFlags,
  setAiFlag,
  type AiFlagKey,
} from "@/lib/ai/flags";

export interface AiPauseState {
  globalPaused: boolean;
  simulationMode: boolean;
  outboundAutoSend: boolean;
  agents: Record<AiAgentId, { enabled: boolean; flagKey: AiFlagKey }>;
}

export async function isGlobalAiPaused(): Promise<boolean> {
  return getAiFlag("AI_GLOBAL_PAUSE");
}

export async function isSimulationMode(): Promise<boolean> {
  return getAiFlag("AI_SIMULATION_MODE");
}

export async function isAgentEnabled(agentId: AiAgentId): Promise<boolean> {
  if (await isGlobalAiPaused()) return false;
  return getAiFlag(agentFlagKey(agentId));
}

export async function getAiPauseState(): Promise<AiPauseState> {
  const flags = await listAiFeatureFlags();
  const byKey = new Map(flags.map((f) => [f.key, f.enabled]));

  const agentIds: AiAgentId[] = [
    "revenue_director",
    "ops_director",
    "retention_director",
    "b2b_sales_director",
    "growth_director",
    "chief_of_staff",
  ];

  const agents = {} as AiPauseState["agents"];
  for (const id of agentIds) {
    const flagKey = agentFlagKey(id);
    agents[id] = {
      enabled: Boolean(byKey.get(flagKey)),
      flagKey,
    };
  }

  return {
    globalPaused: Boolean(byKey.get("AI_GLOBAL_PAUSE")),
    simulationMode: Boolean(byKey.get("AI_SIMULATION_MODE")),
    outboundAutoSend: Boolean(byKey.get("AI_OUTBOUND_AUTO_SEND")),
    agents,
  };
}

export async function setGlobalAiPause(input: {
  paused: boolean;
  updatedByProfileId?: string | null;
}): Promise<{ ok: boolean; reason?: string }> {
  return setAiFlag({
    key: "AI_GLOBAL_PAUSE",
    enabled: input.paused,
    updatedByProfileId: input.updatedByProfileId,
  });
}

export async function setAgentPaused(input: {
  agentId: AiAgentId;
  /** paused=true means agent flag enabled=false */
  paused: boolean;
  updatedByProfileId?: string | null;
}): Promise<{ ok: boolean; reason?: string }> {
  return setAiFlag({
    key: agentFlagKey(input.agentId),
    enabled: !input.paused,
    updatedByProfileId: input.updatedByProfileId,
  });
}
