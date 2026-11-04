/**
 * Persist / list AI opportunities via ai_recommendations (no second table).
 */

import { createAdminClient, hasAdminEnv } from "@/lib/supabase/admin";
import type { AiOpportunity } from "@/lib/ai/types";
import type { Json } from "@/types/database.types";

export interface StoredOpportunity {
  id: string;
  agentId: string;
  recommendationType: string;
  permissionLevel: string;
  status: string;
  title: string;
  summary: string | null;
  entityType: string | null;
  entityId: string | null;
  potentialCentsEstimate: number | null;
  confidence: number | null;
  evidence: string | null;
  createdAt: string;
  isEstimate: boolean;
}

export async function countOpenOpportunities(): Promise<number | null> {
  if (!hasAdminEnv()) return null;
  try {
    const supabase = createAdminClient();
    const { count, error } = await supabase
      .from("ai_recommendations")
      .select("*", { count: "exact", head: true })
      .eq("status", "open");
    if (error) return null;
    return count ?? 0;
  } catch {
    return null;
  }
}

export async function listOpenOpportunities(limit = 50): Promise<{
  items: StoredOpportunity[];
  available: boolean;
  gapReason?: string;
}> {
  if (!hasAdminEnv()) {
    return { items: [], available: false, gapReason: "Database not configured." };
  }
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("ai_recommendations")
      .select(
        "id, agent_id, recommendation_type, permission_level, status, title, summary, entity_type, entity_id, potential_cents_estimate, confidence, evidence, created_at, payload",
      )
      .eq("status", "open")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      if (/ai_recommendations|does not exist|schema cache/i.test(error.message)) {
        return {
          items: [],
          available: false,
          gapReason: "Apply migration 00030 (ai_recommendations).",
        };
      }
      return { items: [], available: false, gapReason: error.message };
    }

    const items = (data ?? []).map((row) => {
      const r = row as Record<string, unknown>;
      const payload = (r.payload ?? {}) as Record<string, unknown>;
      return {
        id: String(r.id),
        agentId: String(r.agent_id),
        recommendationType: String(r.recommendation_type),
        permissionLevel: String(r.permission_level),
        status: String(r.status),
        title: String(r.title),
        summary: r.summary ? String(r.summary) : null,
        entityType: r.entity_type ? String(r.entity_type) : null,
        entityId: r.entity_id ? String(r.entity_id) : null,
        potentialCentsEstimate:
          r.potential_cents_estimate != null
            ? Number(r.potential_cents_estimate)
            : null,
        confidence: r.confidence != null ? Number(r.confidence) : null,
        evidence: r.evidence ? String(r.evidence) : null,
        createdAt: String(r.created_at),
        isEstimate: payload.isEstimate !== false,
      };
    });

    return { items, available: true };
  } catch (err) {
    return {
      items: [],
      available: false,
      gapReason: err instanceof Error ? err.message : "List failed.",
    };
  }
}

/** Upsert open recommendation by type (+ optional entity). Soft-fail. */
export async function upsertOpenOpportunity(
  opp: AiOpportunity,
): Promise<{ id: string | null; reason?: string }> {
  if (!hasAdminEnv()) return { id: null, reason: "Database not configured." };
  try {
    const supabase = createAdminClient();
    const entityType = "aggregate";
    const entityId = opp.category;

    const { data: existing } = await supabase
      .from("ai_recommendations")
      .select("id")
      .eq("agent_id", opp.agentId)
      .eq("recommendation_type", opp.category)
      .eq("entity_type", entityType)
      .eq("entity_id", entityId)
      .eq("status", "open")
      .maybeSingle();

    const payload = {
      isEstimate: opp.isEstimate,
      aiEligible: opp.aiEligible,
      recommendedAction: opp.recommendedAction,
      opportunityId: opp.id,
    } as Json;

    if (existing) {
      const id = String((existing as { id: string }).id);
      const { error } = await supabase
        .from("ai_recommendations")
        .update({
          title: opp.title,
          summary: opp.recommendedAction,
          potential_cents_estimate: opp.potentialCentsEstimate,
          confidence: opp.confidence,
          evidence: opp.evidence,
          permission_level: opp.permissionLevel,
          payload,
          updated_at: new Date().toISOString(),
        } as never)
        .eq("id", id);
      if (error) return { id: null, reason: error.message };
      return { id };
    }

    const { data, error } = await supabase
      .from("ai_recommendations")
      .insert({
        agent_id: opp.agentId,
        recommendation_type: opp.category,
        permission_level: opp.permissionLevel,
        title: opp.title,
        summary: opp.recommendedAction,
        entity_type: entityType,
        entity_id: entityId,
        potential_cents_estimate: opp.potentialCentsEstimate,
        confidence: opp.confidence,
        evidence: opp.evidence,
        payload,
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
    return { id: null, reason: err instanceof Error ? err.message : "Upsert failed." };
  }
}
