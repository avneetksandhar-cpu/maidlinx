import { z } from "zod";
import { jsonError, jsonSuccess } from "@/lib/api/response";
import { requireAdminApiPermission } from "@/lib/admin/session";
import { writeAuditLog } from "@/lib/admin/audit";
import { getPricingEngineMetrics } from "@/lib/admin/pricing-engine";
import {
  listAllPricingRules,
  updatePricingEngineRule,
} from "@/lib/pricing/engine/rules";
import {
  getExperimentResults,
} from "@/lib/pricing/experiments";
import { createAdminClient, hasAdminEnv } from "@/lib/supabase/admin";

const updateEngineRuleSchema = z.object({
  id: z.string().uuid(),
  dynamicPricingEnabled: z.boolean().optional(),
  demandMultMin: z.number().min(0.85).max(1.25).optional(),
  demandMultMax: z.number().min(0.85).max(1.25).optional(),
  supplyMultMin: z.number().min(0.9).max(1.2).optional(),
  supplyMultMax: z.number().min(0.9).max(1.2).optional(),
  minContributionMarginCents: z.number().int().min(0).optional(),
  minContributionMarginPct: z.number().min(0).max(100).optional(),
  maxDiscountStackPct: z.number().min(0).max(100).optional(),
  cleanerHourlyCents: z.number().int().min(0).optional(),
  travelBaseCents: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

export async function GET(request: Request) {
  try {
    await requireAdminApiPermission("pricing.write");
    const url = new URL(request.url);
    const experimentId = url.searchParams.get("experimentId");

    if (experimentId) {
      const results = await getExperimentResults(experimentId);
      return jsonSuccess({ results });
    }

    const [rules, metrics] = await Promise.all([
      listAllPricingRules(),
      getPricingEngineMetrics(),
    ]);

    let experiments: unknown[] = [];
    if (hasAdminEnv()) {
      const supabase = createAdminClient();
      const { data } = await supabase
        .from("pricing_experiments")
        .select("id, key, name, status, auto_deploy_winner, started_at, ended_at, variants")
        .order("created_at", { ascending: false })
        .limit(50);
      experiments = (data ?? []).map((row) => {
        const r = row as Record<string, unknown>;
        return {
          id: String(r.id),
          key: String(r.key),
          name: String(r.name),
          status: String(r.status),
          autoDeployWinner: false,
          startedAt: r.started_at ? String(r.started_at) : null,
          endedAt: r.ended_at ? String(r.ended_at) : null,
          variants: r.variants,
        };
      });
    }

    return jsonSuccess({ rules, metrics, experiments });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Unable to load engine.", 403);
  }
}

export async function PATCH(request: Request) {
  try {
    const admin = await requireAdminApiPermission("pricing.write");
    const body = await request.json();
    const parsed = updateEngineRuleSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(parsed.error.errors[0]?.message ?? "Invalid update.", 400);
    }

    const { id, ...updates } = parsed.data;
    await updatePricingEngineRule(admin.id, id, updates);
    await writeAuditLog({
      adminProfileId: admin.id,
      action: "pricing_engine.update",
      entityType: "pricing_rules",
      entityId: id,
      metadata: updates,
    });

    return jsonSuccess({ updated: true });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Update failed.", 400);
  }
}
