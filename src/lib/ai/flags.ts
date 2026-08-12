/**
 * AI feature flags — DB-backed (ai_feature_flags) with safe defaults.
 * Env overrides: AI_GLOBAL_PAUSE=true|1, AI_SIMULATION_MODE=false|0, etc.
 */

import { createAdminClient, hasAdminEnv } from "@/lib/supabase/admin";
import type { AiAgentId } from "@/lib/ai/types";
import type { Json } from "@/types/database.types";

export const AI_FLAG_KEYS = [
  "AI_GLOBAL_PAUSE",
  "AI_SIMULATION_MODE",
  "AI_BUSINESS_EVENTS",
  "AI_REVENUE_DIRECTOR",
  "AI_OPS_DIRECTOR",
  "AI_RETENTION_DIRECTOR",
  "AI_B2B_SALES_DIRECTOR",
  "AI_GROWTH_DIRECTOR",
  "AI_CHIEF_OF_STAFF",
  "AI_OUTBOUND_AUTO_SEND",
] as const;

export type AiFlagKey = (typeof AI_FLAG_KEYS)[number];

export interface AiFeatureFlag {
  key: AiFlagKey | string;
  enabled: boolean;
  description: string | null;
  metadata: Record<string, unknown>;
  updatedAt: string | null;
}

const DEFAULTS: Record<AiFlagKey, boolean> = {
  AI_GLOBAL_PAUSE: false,
  AI_SIMULATION_MODE: true,
  AI_BUSINESS_EVENTS: true,
  AI_REVENUE_DIRECTOR: true,
  AI_OPS_DIRECTOR: false,
  AI_RETENTION_DIRECTOR: false,
  AI_B2B_SALES_DIRECTOR: false,
  AI_GROWTH_DIRECTOR: false,
  AI_CHIEF_OF_STAFF: false,
  AI_OUTBOUND_AUTO_SEND: false,
};

const AGENT_FLAG: Record<AiAgentId, AiFlagKey> = {
  revenue_director: "AI_REVENUE_DIRECTOR",
  ops_director: "AI_OPS_DIRECTOR",
  retention_director: "AI_RETENTION_DIRECTOR",
  b2b_sales_director: "AI_B2B_SALES_DIRECTOR",
  growth_director: "AI_GROWTH_DIRECTOR",
  chief_of_staff: "AI_CHIEF_OF_STAFF",
};

function envOverride(key: AiFlagKey): boolean | null {
  const raw = process.env[key];
  if (raw == null || raw === "") return null;
  if (raw === "1" || raw.toLowerCase() === "true") return true;
  if (raw === "0" || raw.toLowerCase() === "false") return false;
  return null;
}

export function agentFlagKey(agentId: AiAgentId): AiFlagKey {
  return AGENT_FLAG[agentId];
}

export async function listAiFeatureFlags(): Promise<AiFeatureFlag[]> {
  const fromDb = await loadFlagsFromDb();
  return AI_FLAG_KEYS.map((key) => {
    const env = envOverride(key);
    const row = fromDb.get(key);
    const enabled = env ?? row?.enabled ?? DEFAULTS[key];
    return {
      key,
      enabled,
      description: row?.description ?? null,
      metadata: row?.metadata ?? {},
      updatedAt: row?.updatedAt ?? null,
    };
  });
}

export async function getAiFlag(key: AiFlagKey): Promise<boolean> {
  const env = envOverride(key);
  if (env != null) return env;

  if (!hasAdminEnv()) return DEFAULTS[key];

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("ai_feature_flags")
      .select("enabled")
      .eq("key", key)
      .maybeSingle();

    if (error) {
      if (/ai_feature_flags|does not exist|schema cache/i.test(error.message)) {
        return DEFAULTS[key];
      }
      return DEFAULTS[key];
    }
    if (!data) return DEFAULTS[key];
    return Boolean((data as { enabled?: boolean }).enabled);
  } catch {
    return DEFAULTS[key];
  }
}

export async function setAiFlag(input: {
  key: AiFlagKey;
  enabled: boolean;
  updatedByProfileId?: string | null;
}): Promise<{ ok: boolean; reason?: string }> {
  // Hard safety: outbound auto-send cannot be enabled via owner UI in foundation.
  if (input.key === "AI_OUTBOUND_AUTO_SEND" && input.enabled) {
    return {
      ok: false,
      reason: "AI_OUTBOUND_AUTO_SEND stays OFF in foundation (founder code change required).",
    };
  }

  if (!hasAdminEnv()) {
    return { ok: false, reason: "Database not configured." };
  }

  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("ai_feature_flags").upsert(
      {
        key: input.key,
        enabled: input.enabled,
        updated_by_profile_id: input.updatedByProfileId ?? null,
        updated_at: new Date().toISOString(),
        metadata: {} as Json,
      } as never,
      { onConflict: "key" },
    );

    if (error) {
      if (/ai_feature_flags|does not exist|schema cache/i.test(error.message)) {
        return { ok: false, reason: "Apply migration 00030 (ai_feature_flags)." };
      }
      return { ok: false, reason: error.message };
    }
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      reason: err instanceof Error ? err.message : "Flag update failed.",
    };
  }
}

async function loadFlagsFromDb(): Promise<
  Map<string, { enabled: boolean; description: string | null; metadata: Record<string, unknown>; updatedAt: string | null }>
> {
  const map = new Map<
    string,
    {
      enabled: boolean;
      description: string | null;
      metadata: Record<string, unknown>;
      updatedAt: string | null;
    }
  >();
  if (!hasAdminEnv()) return map;

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase.from("ai_feature_flags").select("*");
    if (error || !data) return map;
    for (const row of data) {
      const r = row as Record<string, unknown>;
      map.set(String(r.key), {
        enabled: Boolean(r.enabled),
        description: r.description ? String(r.description) : null,
        metadata: (r.metadata as Record<string, unknown>) ?? {},
        updatedAt: r.updated_at ? String(r.updated_at) : null,
      });
    }
  } catch {
    /* soft */
  }
  return map;
}
