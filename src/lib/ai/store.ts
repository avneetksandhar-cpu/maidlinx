/**
 * Persistence helpers for ai_recommendations / ai_decisions / ai_actions / ai_exceptions.
 * Soft-fail when migration not applied. No auto-execution.
 */

import { createAdminClient, hasAdminEnv } from "@/lib/supabase/admin";
import type { AiAgentId, AiPermissionLevel } from "@/lib/ai/types";
import type { Json } from "@/types/database.types";

export async function recordAiRecommendation(input: {
  agentId: AiAgentId | string;
  recommendationType: string;
  permissionLevel: AiPermissionLevel;
  title: string;
  summary?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  potentialCentsEstimate?: number | null;
  confidence?: number | null;
  evidence?: string | null;
  payload?: Record<string, unknown>;
}): Promise<{ id: string | null; reason?: string }> {
  if (!hasAdminEnv()) return { id: null, reason: "Database not configured." };
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("ai_recommendations")
      .insert({
        agent_id: input.agentId,
        recommendation_type: input.recommendationType,
        permission_level: input.permissionLevel,
        title: input.title,
        summary: input.summary ?? null,
        entity_type: input.entityType ?? null,
        entity_id: input.entityId ?? null,
        potential_cents_estimate: input.potentialCentsEstimate ?? null,
        confidence: input.confidence ?? null,
        evidence: input.evidence ?? null,
        payload: (input.payload ?? {}) as Json,
      } as never)
      .select("id")
      .maybeSingle();

    if (error) {
      if (/ai_recommendations|does not exist|schema cache/i.test(error.message)) {
        return { id: null, reason: "Apply migration 00030." };
      }
      return { id: null, reason: error.message };
    }
    return { id: data ? String((data as { id: string }).id) : null };
  } catch (err) {
    return { id: null, reason: err instanceof Error ? err.message : "Insert failed." };
  }
}

export async function recordAiDecision(input: {
  agentId: AiAgentId | string;
  decisionType: string;
  permissionLevel: AiPermissionLevel;
  summary: string;
  recommendationId?: string | null;
  decidedBy?: "system" | "founder" | "admin" | "agent";
  decidedByProfileId?: string | null;
  outcome?: "recorded" | "approved" | "rejected" | "deferred" | "simulated";
  payload?: Record<string, unknown>;
}): Promise<{ id: string | null; reason?: string }> {
  if (!hasAdminEnv()) return { id: null, reason: "Database not configured." };
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("ai_decisions")
      .insert({
        agent_id: input.agentId,
        decision_type: input.decisionType,
        permission_level: input.permissionLevel,
        recommendation_id: input.recommendationId ?? null,
        decided_by: input.decidedBy ?? "system",
        decided_by_profile_id: input.decidedByProfileId ?? null,
        outcome: input.outcome ?? "recorded",
        summary: input.summary,
        payload: (input.payload ?? {}) as Json,
      } as never)
      .select("id")
      .maybeSingle();

    if (error) {
      if (/ai_decisions|does not exist|schema cache/i.test(error.message)) {
        return { id: null, reason: "Apply migration 00030." };
      }
      return { id: null, reason: error.message };
    }
    return { id: data ? String((data as { id: string }).id) : null };
  } catch (err) {
    return { id: null, reason: err instanceof Error ? err.message : "Insert failed." };
  }
}

export async function recordAiAction(input: {
  agentId: AiAgentId | string;
  action: string;
  permissionLevel: AiPermissionLevel;
  summary: string;
  status?:
    | "planned"
    | "simulated"
    | "awaiting_approval"
    | "approved"
    | "rejected"
    | "executed"
    | "failed"
    | "cancelled";
  decisionId?: string | null;
  approvalId?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  simulation?: boolean;
  payload?: Record<string, unknown>;
  error?: string | null;
}): Promise<{ id: string | null; reason?: string }> {
  if (!hasAdminEnv()) return { id: null, reason: "Database not configured." };
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("ai_actions")
      .insert({
        agent_id: input.agentId,
        action: input.action,
        permission_level: input.permissionLevel,
        status: input.status ?? (input.simulation === false ? "planned" : "simulated"),
        decision_id: input.decisionId ?? null,
        approval_id: input.approvalId ?? null,
        entity_type: input.entityType ?? null,
        entity_id: input.entityId ?? null,
        summary: input.summary,
        simulation: input.simulation ?? true,
        payload: (input.payload ?? {}) as Json,
        error: input.error ?? null,
      } as never)
      .select("id")
      .maybeSingle();

    if (error) {
      if (/ai_actions|does not exist|schema cache/i.test(error.message)) {
        return { id: null, reason: "Apply migration 00030." };
      }
      return { id: null, reason: error.message };
    }
    return { id: data ? String((data as { id: string }).id) : null };
  } catch (err) {
    return { id: null, reason: err instanceof Error ? err.message : "Insert failed." };
  }
}

export async function recordAiException(input: {
  agentId?: AiAgentId | string | null;
  exceptionType: string;
  severity?: "info" | "warning" | "critical";
  summary: string;
  entityType?: string | null;
  entityId?: string | null;
  payload?: Record<string, unknown>;
}): Promise<{ id: string | null; reason?: string }> {
  if (!hasAdminEnv()) return { id: null, reason: "Database not configured." };
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("ai_exceptions")
      .insert({
        agent_id: input.agentId ?? null,
        exception_type: input.exceptionType,
        severity: input.severity ?? "warning",
        summary: input.summary,
        entity_type: input.entityType ?? null,
        entity_id: input.entityId ?? null,
        payload: (input.payload ?? {}) as Json,
      } as never)
      .select("id")
      .maybeSingle();

    if (error) {
      if (/ai_exceptions|does not exist|schema cache/i.test(error.message)) {
        return { id: null, reason: "Apply migration 00030." };
      }
      return { id: null, reason: error.message };
    }
    return { id: data ? String((data as { id: string }).id) : null };
  } catch (err) {
    return { id: null, reason: err instanceof Error ? err.message : "Insert failed." };
  }
}
