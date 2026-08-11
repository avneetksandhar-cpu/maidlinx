import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/types/database.types";

export interface AuditEntry {
  id: string;
  adminProfileId: string;
  adminName: string;
  action: string;
  entityType: string;
  entityId: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export async function writeAuditLog(input: {
  adminProfileId: string;
  action: string;
  entityType: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase.from("admin_audit_log").insert({
    admin_profile_id: input.adminProfileId,
    action: input.action,
    entity_type: input.entityType,
    entity_id: input.entityId ?? null,
    metadata: (input.metadata ?? {}) as Json,
  });

  if (error && !error.message.includes("admin_audit_log")) {
    throw new Error(error.message);
  }
}

export async function getAuditHistory(limit = 100): Promise<AuditEntry[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("admin_audit_log")
    .select(
      `
      *,
      admin:profiles!admin_audit_log_admin_profile_id_fkey (first_name, last_name)
    `,
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    if (error.message.includes("admin_audit_log")) return [];
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => {
    const record = row as Record<string, unknown>;
    const admin = record.admin as Record<string, unknown> | null;
    return {
      id: String(record.id),
      adminProfileId: String(record.admin_profile_id),
      adminName:
        [admin?.first_name, admin?.last_name].filter(Boolean).join(" ") || "Admin",
      action: String(record.action),
      entityType: String(record.entity_type),
      entityId: record.entity_id ? String(record.entity_id) : null,
      metadata: (record.metadata as Record<string, unknown>) ?? {},
      createdAt: String(record.created_at),
    };
  });
}

export async function writeSystemLog(input: {
  level: "info" | "warn" | "error" | "debug";
  source: string;
  message: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const supabase = createAdminClient();
  await supabase.from("system_logs").insert({
    level: input.level,
    source: input.source,
    message: input.message,
    metadata: (input.metadata ?? {}) as Json,
  });
}

export async function getSystemLogs(limit = 100): Promise<
  Array<{
    id: string;
    level: string;
    source: string;
    message: string;
    metadata: Record<string, unknown>;
    createdAt: string;
  }>
> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("system_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    if (error.message.includes("system_logs")) return [];
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => {
    const record = row as Record<string, unknown>;
    return {
      id: String(record.id),
      level: String(record.level),
      source: String(record.source),
      message: String(record.message),
      metadata: (record.metadata as Record<string, unknown>) ?? {},
      createdAt: String(record.created_at),
    };
  });
}
