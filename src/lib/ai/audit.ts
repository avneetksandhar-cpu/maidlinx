/**
 * AI audit log — append-only via service role after owner/admin gate.
 */

import { createAdminClient, hasAdminEnv } from "@/lib/supabase/admin";
import type { AiAgentId, AiPermissionLevel } from "@/lib/ai/types";
import type { Json } from "@/types/database.types";

export interface AiAuditEntry {
  id: string;
  agentId: string;
  action: string;
  permissionLevel: AiPermissionLevel;
  actorProfileId: string | null;
  entityType: string | null;
  entityId: string | null;
  summary: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export async function writeAiAuditLog(input: {
  agentId: AiAgentId | string;
  action: string;
  permissionLevel: AiPermissionLevel;
  actorProfileId?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  summary?: string | null;
  metadata?: Record<string, unknown>;
}): Promise<{ written: boolean; reason?: string }> {
  if (!hasAdminEnv()) {
    return { written: false, reason: "Database not configured." };
  }

  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("ai_audit_log").insert({
      agent_id: input.agentId,
      action: input.action,
      permission_level: input.permissionLevel,
      actor_profile_id: input.actorProfileId ?? null,
      entity_type: input.entityType ?? null,
      entity_id: input.entityId ?? null,
      summary: input.summary ?? null,
      metadata: (input.metadata ?? {}) as Json,
    });

    if (error) {
      if (/ai_audit_log|does not exist|schema cache/i.test(error.message)) {
        return {
          written: false,
          reason: "Apply migration 00029 (ai_audit_log).",
        };
      }
      return { written: false, reason: error.message };
    }
    return { written: true };
  } catch (err) {
    return {
      written: false,
      reason: err instanceof Error ? err.message : "Audit write failed.",
    };
  }
}

export async function listAiAuditLog(limit = 50): Promise<AiAuditEntry[]> {
  if (!hasAdminEnv()) return [];

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("ai_audit_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      if (/ai_audit_log|does not exist/i.test(error.message)) return [];
      return [];
    }

    return (data ?? []).map((row) => {
      const r = row as Record<string, unknown>;
      return {
        id: String(r.id),
        agentId: String(r.agent_id),
        action: String(r.action),
        permissionLevel: String(r.permission_level) as AiPermissionLevel,
        actorProfileId: r.actor_profile_id ? String(r.actor_profile_id) : null,
        entityType: r.entity_type ? String(r.entity_type) : null,
        entityId: r.entity_id ? String(r.entity_id) : null,
        summary: r.summary ? String(r.summary) : null,
        metadata: (r.metadata as Record<string, unknown>) ?? {},
        createdAt: String(r.created_at),
      };
    });
  } catch {
    return [];
  }
}
