import { createAdminClient, hasAdminEnv } from "@/lib/supabase/admin";
import type { Json } from "@/types/database.types";

export async function writeCleanerPlatformAudit(input: {
  actorId?: string | null;
  actorRole?: string | null;
  action: string;
  cleanerId?: string | null;
  entityType?: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  if (!hasAdminEnv()) return;
  const supabase = createAdminClient();
  const { error } = await supabase.from("cleaner_platform_audit_log").insert({
    actor_id: input.actorId ?? null,
    actor_role: input.actorRole ?? null,
    action: input.action,
    cleaner_id: input.cleanerId ?? null,
    entity_type: input.entityType ?? "cleaner",
    entity_id: input.entityId ?? input.cleanerId ?? null,
    metadata: (input.metadata ?? {}) as Json,
  });

  // Table may not exist until migration applied — fail soft for local/dev.
  if (error && !error.message.includes("cleaner_platform_audit_log")) {
    console.error("[cleaner-platform-audit]", error.message);
  }
}

export async function listCleanerPlatformAudit(limit = 100): Promise<
  Array<{
    id: string;
    actorId: string | null;
    actorRole: string | null;
    action: string;
    cleanerId: string | null;
    entityType: string;
    entityId: string | null;
    metadata: Record<string, unknown>;
    createdAt: string;
  }>
> {
  if (!hasAdminEnv()) return [];
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("cleaner_platform_audit_log")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    if (error.message.includes("cleaner_platform_audit_log")) return [];
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => {
    const r = row as Record<string, unknown>;
    return {
      id: String(r.id),
      actorId: r.actor_id ? String(r.actor_id) : null,
      actorRole: r.actor_role ? String(r.actor_role) : null,
      action: String(r.action),
      cleanerId: r.cleaner_id ? String(r.cleaner_id) : null,
      entityType: String(r.entity_type ?? "cleaner"),
      entityId: r.entity_id ? String(r.entity_id) : null,
      metadata: (r.metadata as Record<string, unknown>) ?? {},
      createdAt: String(r.created_at),
    };
  });
}
