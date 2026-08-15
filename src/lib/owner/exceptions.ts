/**
 * Owner exceptions inbox — merges ai_exceptions + dispatch_exceptions.
 */

import { createAdminClient, hasAdminEnv } from "@/lib/supabase/admin";
import type { Json } from "@/types/database.types";

export type ExceptionSeverity = "info" | "warning" | "critical" | "low" | "medium" | "high";
export type ExceptionStatus =
  | "open"
  | "acknowledged"
  | "resolved"
  | "ignored"
  | "under_review"
  | "dismissed";

export interface OwnerExceptionItem {
  id: string;
  source: "ai_exceptions" | "dispatch_exceptions";
  exceptionType: string;
  severity: string;
  status: string;
  summary: string;
  entityType: string | null;
  entityId: string | null;
  createdAt: string;
}

export async function listOpenAiExceptions(limit = 50): Promise<{
  items: OwnerExceptionItem[];
  count: number;
  available: boolean;
  gapReason?: string;
}> {
  if (!hasAdminEnv()) {
    return { items: [], count: 0, available: false, gapReason: "Database not configured." };
  }

  const supabase = createAdminClient();
  const items: OwnerExceptionItem[] = [];
  let gapReason: string | undefined;

  const ai = await supabase
    .from("ai_exceptions")
    .select("id, exception_type, severity, status, summary, entity_type, entity_id, created_at")
    .in("status", ["open", "acknowledged"])
    .order("created_at", { ascending: false })
    .limit(limit);

  if (ai.error) {
    if (!/ai_exceptions|does not exist|schema cache/i.test(ai.error.message)) {
      gapReason = ai.error.message;
    } else {
      gapReason = "Apply migration 00030 (ai_exceptions).";
    }
  } else {
    for (const row of ai.data ?? []) {
      const r = row as Record<string, unknown>;
      items.push({
        id: String(r.id),
        source: "ai_exceptions",
        exceptionType: String(r.exception_type),
        severity: String(r.severity),
        status: String(r.status),
        summary: String(r.summary),
        entityType: r.entity_type ? String(r.entity_type) : null,
        entityId: r.entity_id ? String(r.entity_id) : null,
        createdAt: String(r.created_at),
      });
    }
  }

  const dispatch = await supabase
    .from("dispatch_exceptions")
    .select(
      "id, exception_type, severity, status, notes, booking_id, cleaner_id, created_at",
    )
    .in("status", ["open", "under_review"])
    .order("created_at", { ascending: false })
    .limit(limit);

  if (!dispatch.error) {
    for (const row of dispatch.data ?? []) {
      const r = row as Record<string, unknown>;
      items.push({
        id: String(r.id),
        source: "dispatch_exceptions",
        exceptionType: String(r.exception_type),
        severity: String(r.severity),
        status: String(r.status),
        summary: r.notes ? String(r.notes) : `Dispatch: ${String(r.exception_type)}`,
        entityType: r.booking_id ? "booking" : r.cleaner_id ? "cleaner" : null,
        entityId: r.booking_id
          ? String(r.booking_id)
          : r.cleaner_id
            ? String(r.cleaner_id)
            : null,
        createdAt: String(r.created_at),
      });
    }
  }

  items.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  return {
    items: items.slice(0, limit),
    count: items.length,
    available: !gapReason || items.length > 0,
    gapReason,
  };
}

export async function updateAiExceptionStatus(input: {
  id: string;
  status: "open" | "acknowledged" | "resolved" | "ignored";
}): Promise<{ ok: boolean; reason?: string }> {
  if (!hasAdminEnv()) return { ok: false, reason: "Database not configured." };
  try {
    const supabase = createAdminClient();
    const patch: Record<string, unknown> = { status: input.status };
    if (input.status === "resolved" || input.status === "ignored") {
      patch.resolved_at = new Date().toISOString();
    }
    const { error } = await supabase
      .from("ai_exceptions")
      .update(patch as never)
      .eq("id", input.id);
    if (error) return { ok: false, reason: error.message };
    return { ok: true };
  } catch (err) {
    return { ok: false, reason: err instanceof Error ? err.message : "Update failed." };
  }
}

export async function ensureCapacityException(summary: string): Promise<void> {
  if (!hasAdminEnv()) return;
  try {
    const supabase = createAdminClient();
    const { count } = await supabase
      .from("ai_exceptions")
      .select("*", { count: "exact", head: true })
      .eq("exception_type", "unused_capacity")
      .eq("status", "open");
    if ((count ?? 0) > 0) return;
    await supabase.from("ai_exceptions").insert({
      agent_id: "ops_director",
      exception_type: "unused_capacity",
      severity: "info",
      summary,
      payload: {} as Json,
    } as never);
  } catch {
    /* soft-fail */
  }
}
