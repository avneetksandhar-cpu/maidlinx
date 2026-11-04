/**
 * Founder intervention tracking + weekly trend.
 */

import { createAdminClient, hasAdminEnv } from "@/lib/supabase/admin";
import type { Json } from "@/types/database.types";

export interface FounderIntervention {
  id: string;
  interventionType: string;
  severity: string;
  summary: string;
  entityType: string | null;
  entityId: string | null;
  actorProfileId: string | null;
  createdAt: string;
}

export interface InterventionWeekPoint {
  weekStart: string;
  count: number;
}

export async function countFounderInterventionsWeek(): Promise<number | null> {
  if (!hasAdminEnv()) return null;
  try {
    const since = new Date();
    since.setDate(since.getDate() - 7);
    const supabase = createAdminClient();
    const { count, error } = await supabase
      .from("founder_interventions")
      .select("*", { count: "exact", head: true })
      .gte("created_at", since.toISOString());
    if (error) return null;
    return count ?? 0;
  } catch {
    return null;
  }
}

export async function listFounderInterventions(limit = 40): Promise<{
  items: FounderIntervention[];
  available: boolean;
  gapReason?: string;
}> {
  if (!hasAdminEnv()) {
    return { items: [], available: false, gapReason: "Database not configured." };
  }
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("founder_interventions")
      .select(
        "id, intervention_type, severity, summary, entity_type, entity_id, actor_profile_id, created_at",
      )
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      if (/founder_interventions|does not exist|schema cache/i.test(error.message)) {
        return {
          items: [],
          available: false,
          gapReason: "Apply migration 00031 (founder_interventions).",
        };
      }
      return { items: [], available: false, gapReason: error.message };
    }

    return {
      items: (data ?? []).map((row) => {
        const r = row as Record<string, unknown>;
        return {
          id: String(r.id),
          interventionType: String(r.intervention_type),
          severity: String(r.severity),
          summary: String(r.summary),
          entityType: r.entity_type ? String(r.entity_type) : null,
          entityId: r.entity_id ? String(r.entity_id) : null,
          actorProfileId: r.actor_profile_id ? String(r.actor_profile_id) : null,
          createdAt: String(r.created_at),
        };
      }),
      available: true,
    };
  } catch (err) {
    return {
      items: [],
      available: false,
      gapReason: err instanceof Error ? err.message : "List failed.",
    };
  }
}

export async function recordFounderIntervention(input: {
  interventionType: string;
  summary: string;
  severity?: "info" | "warning" | "critical";
  entityType?: string | null;
  entityId?: string | null;
  actorProfileId?: string | null;
  relatedExceptionId?: string | null;
  relatedRecommendationId?: string | null;
  payload?: Record<string, unknown>;
}): Promise<{ id: string | null; reason?: string }> {
  if (!hasAdminEnv()) return { id: null, reason: "Database not configured." };
  if (!input.summary.trim()) return { id: null, reason: "Summary required." };

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("founder_interventions")
      .insert({
        intervention_type: input.interventionType,
        severity: input.severity ?? "info",
        summary: input.summary.trim(),
        entity_type: input.entityType ?? null,
        entity_id: input.entityId ?? null,
        actor_profile_id: input.actorProfileId ?? null,
        related_exception_id: input.relatedExceptionId ?? null,
        related_recommendation_id: input.relatedRecommendationId ?? null,
        payload: (input.payload ?? {}) as Json,
      } as never)
      .select("id")
      .maybeSingle();

    if (error) {
      if (/founder_interventions|does not exist|schema cache/i.test(error.message)) {
        return { id: null, reason: "Apply migration 00031." };
      }
      return { id: null, reason: error.message };
    }
    return { id: data ? String((data as { id: string }).id) : null };
  } catch (err) {
    return { id: null, reason: err instanceof Error ? err.message : "Insert failed." };
  }
}

export async function getInterventionWeeklyTrend(weeks = 8): Promise<{
  points: InterventionWeekPoint[];
  available: boolean;
  gapReason?: string;
}> {
  if (!hasAdminEnv()) {
    return { points: [], available: false, gapReason: "Database not configured." };
  }
  try {
    const since = new Date();
    since.setDate(since.getDate() - weeks * 7);
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("founder_interventions")
      .select("created_at")
      .gte("created_at", since.toISOString())
      .order("created_at", { ascending: true });

    if (error) {
      if (/founder_interventions|does not exist|schema cache/i.test(error.message)) {
        return {
          points: [],
          available: false,
          gapReason: "Apply migration 00031.",
        };
      }
      return { points: [], available: false, gapReason: error.message };
    }

    const buckets = new Map<string, number>();
    for (let i = weeks - 1; i >= 0; i -= 1) {
      const d = new Date();
      d.setDate(d.getDate() - i * 7);
      const day = d.getDay();
      d.setDate(d.getDate() - day);
      d.setHours(0, 0, 0, 0);
      buckets.set(d.toISOString().slice(0, 10), 0);
    }

    for (const row of data ?? []) {
      const created = new Date(String((row as { created_at: string }).created_at));
      const week = new Date(created);
      week.setDate(week.getDate() - week.getDay());
      week.setHours(0, 0, 0, 0);
      const key = week.toISOString().slice(0, 10);
      if (buckets.has(key)) {
        buckets.set(key, (buckets.get(key) ?? 0) + 1);
      }
    }

    return {
      points: Array.from(buckets.entries()).map(([weekStart, count]) => ({
        weekStart,
        count,
      })),
      available: true,
    };
  } catch (err) {
    return {
      points: [],
      available: false,
      gapReason: err instanceof Error ? err.message : "Trend failed.",
    };
  }
}
