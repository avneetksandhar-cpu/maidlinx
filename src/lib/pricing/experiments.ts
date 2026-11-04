/**
 * Pricing experiment framework.
 * Assign sticky variants, track conversions — NEVER auto-deploy winners.
 */

import { createHash, randomBytes } from "crypto";
import { createAdminClient, hasAdminEnv } from "@/lib/supabase/admin";

export interface ExperimentVariant {
  id: string;
  weight: number;
  /** Opaque param overrides for engine (server-side only). */
  params?: Record<string, unknown>;
}

export interface PricingExperiment {
  id: string;
  key: string;
  name: string;
  description: string | null;
  status: "draft" | "running" | "paused" | "completed" | "archived";
  variants: ExperimentVariant[];
  marketId: string | null;
  autoDeployWinner: boolean;
  startedAt: string | null;
  endedAt: string | null;
}

export interface ExperimentAssignment {
  experimentId: string;
  experimentKey: string;
  variantId: string;
  anonymousSessionId: string;
}

function parseVariants(raw: unknown): ExperimentVariant[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((v) => {
      const row = v as Record<string, unknown>;
      return {
        id: String(row.id ?? ""),
        weight: Number(row.weight ?? 0),
        params:
          row.params && typeof row.params === "object"
            ? (row.params as Record<string, unknown>)
            : undefined,
      };
    })
    .filter((v) => v.id && v.weight > 0);
}

/** Deterministic sticky assignment from session id. */
export function pickVariant(
  experimentKey: string,
  anonymousSessionId: string,
  variants: ExperimentVariant[],
): string {
  if (variants.length === 0) return "control";
  const total = variants.reduce((s, v) => s + v.weight, 0);
  if (total <= 0) return variants[0]!.id;

  const digest = createHash("sha256")
    .update(`${experimentKey}:${anonymousSessionId}`)
    .digest();
  const bucket = digest.readUInt32BE(0) % total;
  let cursor = 0;
  for (const v of variants) {
    cursor += v.weight;
    if (bucket < cursor) return v.id;
  }
  return variants[variants.length - 1]!.id;
}

export async function loadRunningExperiments(
  marketId?: string | null,
): Promise<PricingExperiment[]> {
  if (!hasAdminEnv()) return [];
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("pricing_experiments")
    .select("*")
    .eq("status", "running");

  if (error) {
    if (/pricing_experiments|does not exist/i.test(error.message)) return [];
    throw new Error(error.message);
  }

  return (data ?? [])
    .map((row) => {
      const r = row as Record<string, unknown>;
      return {
        id: String(r.id),
        key: String(r.key),
        name: String(r.name),
        description: r.description ? String(r.description) : null,
        status: r.status as PricingExperiment["status"],
        variants: parseVariants(r.variants),
        marketId: r.market_id ? String(r.market_id) : null,
        // Force false even if DB mis-set — product rule.
        autoDeployWinner: false,
        startedAt: r.started_at ? String(r.started_at) : null,
        endedAt: r.ended_at ? String(r.ended_at) : null,
      };
    })
    .filter((exp) => !exp.marketId || !marketId || exp.marketId === marketId);
}

export async function assignExperimentVariant(input: {
  experiment: PricingExperiment;
  anonymousSessionId: string;
}): Promise<ExperimentAssignment> {
  const variantId = pickVariant(
    input.experiment.key,
    input.anonymousSessionId,
    input.experiment.variants,
  );

  if (!hasAdminEnv()) {
    return {
      experimentId: input.experiment.id,
      experimentKey: input.experiment.key,
      variantId,
      anonymousSessionId: input.anonymousSessionId,
    };
  }

  const supabase = createAdminClient();
  const { data: existing } = await supabase
    .from("pricing_experiment_assignments")
    .select("variant_id")
    .eq("experiment_id", input.experiment.id)
    .eq("anonymous_session_id", input.anonymousSessionId)
    .maybeSingle();

  if (existing) {
    return {
      experimentId: input.experiment.id,
      experimentKey: input.experiment.key,
      variantId: String(existing.variant_id),
      anonymousSessionId: input.anonymousSessionId,
    };
  }

  const { error } = await supabase.from("pricing_experiment_assignments").insert({
    experiment_id: input.experiment.id,
    anonymous_session_id: input.anonymousSessionId,
    variant_id: variantId,
  });

  if (error && !/duplicate|unique/i.test(error.message)) {
    console.error("[experiments] assign failed:", error.message);
  }

  return {
    experimentId: input.experiment.id,
    experimentKey: input.experiment.key,
    variantId,
    anonymousSessionId: input.anonymousSessionId,
  };
}

/** Mark conversion — metrics only; never mutates pricing_rules. */
export async function recordExperimentConversion(input: {
  experimentId: string;
  anonymousSessionId: string;
  bookingId?: string;
  revenueCents?: number;
}): Promise<void> {
  if (!hasAdminEnv()) return;
  const supabase = createAdminClient();
  await supabase
    .from("pricing_experiment_assignments")
    .update({
      converted: true,
      booking_id: input.bookingId ?? null,
      revenue_cents: input.revenueCents ?? null,
    })
    .eq("experiment_id", input.experimentId)
    .eq("anonymous_session_id", input.anonymousSessionId);
}

export interface ExperimentVariantMetrics {
  variantId: string;
  assignments: number;
  conversions: number;
  conversionRate: number | null;
  revenueCents: number;
}

export interface ExperimentResults {
  experiment: PricingExperiment;
  variants: ExperimentVariantMetrics[];
  note: string;
}

export async function getExperimentResults(
  experimentId: string,
): Promise<ExperimentResults | null> {
  if (!hasAdminEnv()) return null;
  const supabase = createAdminClient();

  const { data: exp, error } = await supabase
    .from("pricing_experiments")
    .select("*")
    .eq("id", experimentId)
    .maybeSingle();

  if (error || !exp) {
    if (error && /pricing_experiments|does not exist/i.test(error.message)) return null;
    return null;
  }

  const r = exp as Record<string, unknown>;
  const experiment: PricingExperiment = {
    id: String(r.id),
    key: String(r.key),
    name: String(r.name),
    description: r.description ? String(r.description) : null,
    status: r.status as PricingExperiment["status"],
    variants: parseVariants(r.variants),
    marketId: r.market_id ? String(r.market_id) : null,
    autoDeployWinner: false,
    startedAt: r.started_at ? String(r.started_at) : null,
    endedAt: r.ended_at ? String(r.ended_at) : null,
  };

  const { data: rows } = await supabase
    .from("pricing_experiment_assignments")
    .select("variant_id, converted, revenue_cents")
    .eq("experiment_id", experimentId);

  const byVariant = new Map<string, ExperimentVariantMetrics>();
  for (const v of experiment.variants) {
    byVariant.set(v.id, {
      variantId: v.id,
      assignments: 0,
      conversions: 0,
      conversionRate: null,
      revenueCents: 0,
    });
  }

  for (const row of rows ?? []) {
    const vr = row as Record<string, unknown>;
    const id = String(vr.variant_id);
    const bucket =
      byVariant.get(id) ??
      ({
        variantId: id,
        assignments: 0,
        conversions: 0,
        conversionRate: null,
        revenueCents: 0,
      } satisfies ExperimentVariantMetrics);
    bucket.assignments += 1;
    if (vr.converted) {
      bucket.conversions += 1;
      bucket.revenueCents += Number(vr.revenue_cents ?? 0);
    }
    byVariant.set(id, bucket);
  }

  const variants = [...byVariant.values()].map((v) => ({
    ...v,
    conversionRate:
      v.assignments > 0 ? v.conversions / v.assignments : null,
  }));

  return {
    experiment,
    variants,
    note: "Results are observational only. Winners are never auto-deployed to live pricing.",
  };
}

export function newAnonymousSessionId(): string {
  return `anon_${randomBytes(16).toString("base64url")}`;
}
