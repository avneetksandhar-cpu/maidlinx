/**
 * Owner activity timeline from business_events (+ optional ai_audit_log).
 */

import { createAdminClient, hasAdminEnv } from "@/lib/supabase/admin";

export interface ActivityItem {
  id: string;
  source: "business_events" | "ai_audit_log" | "founder_interventions";
  eventType: string;
  entityType: string | null;
  entityId: string | null;
  summary: string;
  createdAt: string;
  correlationId: string | null;
}

export async function listOwnerActivity(input?: {
  limit?: number;
  eventType?: string | null;
  source?: ActivityItem["source"] | null;
}): Promise<{
  items: ActivityItem[];
  available: boolean;
  gapReason?: string;
}> {
  const limit = input?.limit ?? 60;
  if (!hasAdminEnv()) {
    return { items: [], available: false, gapReason: "Database not configured." };
  }

  const supabase = createAdminClient();
  const items: ActivityItem[] = [];
  let gapReason: string | undefined;

  if (!input?.source || input.source === "business_events") {
    let q = supabase
      .from("business_events")
      .select(
        "id, event_type, entity_type, entity_id, payload, created_at, source, correlation_id" as never,
      )
      .order("created_at", { ascending: false })
      .limit(limit);

    if (input?.eventType) {
      q = q.eq("event_type", input.eventType);
    }

    const { data, error } = await q;
    if (error) {
      if (/correlation_id|column/i.test(error.message)) {
        // Fallback without correlation_id when 00031 not applied
        const fallback = await supabase
          .from("business_events")
          .select("id, event_type, entity_type, entity_id, payload, created_at, source")
          .order("created_at", { ascending: false })
          .limit(limit);
        if (!fallback.error) {
          for (const row of fallback.data ?? []) {
            const r = row as Record<string, unknown>;
            items.push({
              id: String(r.id),
              source: "business_events",
              eventType: String(r.event_type),
              entityType: r.entity_type ? String(r.entity_type) : null,
              entityId: r.entity_id ? String(r.entity_id) : null,
              summary: `${String(r.event_type)} · ${String(r.entity_type)}/${String(r.entity_id)}`,
              createdAt: String(r.created_at),
              correlationId: null,
            });
          }
        } else {
          gapReason = fallback.error.message;
        }
      } else if (/business_events|does not exist|schema cache/i.test(error.message)) {
        gapReason = "Apply migration 00030 (business_events).";
      } else {
        gapReason = error.message;
      }
    } else {
      for (const row of (data ?? []) as unknown as Array<Record<string, unknown>>) {
        const r = row;
        items.push({
          id: String(r.id),
          source: "business_events",
          eventType: String(r.event_type),
          entityType: r.entity_type ? String(r.entity_type) : null,
          entityId: r.entity_id ? String(r.entity_id) : null,
          summary: `${String(r.event_type)} · ${String(r.entity_type)}/${String(r.entity_id)}`,
          createdAt: String(r.created_at),
          correlationId: r.correlation_id ? String(r.correlation_id) : null,
        });
      }
    }
  }

  if (!input?.source || input.source === "ai_audit_log") {
    const { data, error } = await supabase
      .from("ai_audit_log")
      .select("id, agent_id, action, summary, entity_type, entity_id, created_at")
      .order("created_at", { ascending: false })
      .limit(Math.min(limit, 40));

    if (!error) {
      for (const row of data ?? []) {
        const r = row as Record<string, unknown>;
        const eventType = `${String(r.agent_id)}.${String(r.action)}`;
        if (input?.eventType && eventType !== input.eventType) continue;
        items.push({
          id: String(r.id),
          source: "ai_audit_log",
          eventType,
          entityType: r.entity_type ? String(r.entity_type) : null,
          entityId: r.entity_id ? String(r.entity_id) : null,
          summary: r.summary ? String(r.summary) : eventType,
          createdAt: String(r.created_at),
          correlationId: null,
        });
      }
    }
  }

  if (!input?.source || input.source === "founder_interventions") {
    const { data, error } = await supabase
      .from("founder_interventions")
      .select(
        "id, intervention_type, summary, entity_type, entity_id, created_at",
      )
      .order("created_at", { ascending: false })
      .limit(Math.min(limit, 40));

    if (!error) {
      for (const row of data ?? []) {
        const r = row as Record<string, unknown>;
        const eventType = String(r.intervention_type);
        if (input?.eventType && eventType !== input.eventType) continue;
        items.push({
          id: String(r.id),
          source: "founder_interventions",
          eventType,
          entityType: r.entity_type ? String(r.entity_type) : null,
          entityId: r.entity_id ? String(r.entity_id) : null,
          summary: String(r.summary),
          createdAt: String(r.created_at),
          correlationId: null,
        });
      }
    }
  }

  items.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  return {
    items: items.slice(0, limit),
    available: items.length > 0 || !gapReason,
    gapReason,
  };
}
