import { createAdminClient } from "@/lib/supabase/admin";
import { writeAuditLog } from "@/lib/admin/audit";

export interface PricingRule {
  id: string;
  serviceType: string;
  baseCents: number;
  bedroomCents: number;
  bathroomCents: number;
  platformFeePercent: number;
  isActive: boolean;
  updatedAt: string;
}

export async function listPricingRules(): Promise<PricingRule[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("pricing_config")
    .select("*")
    .order("service_type");

  if (error) {
    if (error.message.includes("pricing_config")) return [];
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => {
    const r = row as Record<string, unknown>;
    return {
      id: String(r.id),
      serviceType: String(r.service_type),
      baseCents: Number(r.base_cents),
      bedroomCents: Number(r.bedroom_cents),
      bathroomCents: Number(r.bathroom_cents),
      platformFeePercent: Number(r.platform_fee_percent),
      isActive: Boolean(r.is_active),
      updatedAt: String(r.updated_at),
    };
  });
}

export async function updatePricingRule(
  adminId: string,
  id: string,
  updates: Partial<{
    baseCents: number;
    bedroomCents: number;
    bathroomCents: number;
    platformFeePercent: number;
    isActive: boolean;
  }>,
): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("pricing_config")
    .update({
      base_cents: updates.baseCents,
      bedroom_cents: updates.bedroomCents,
      bathroom_cents: updates.bathroomCents,
      platform_fee_percent: updates.platformFeePercent,
      is_active: updates.isActive,
      updated_by: adminId,
    })
    .eq("id", id);

  if (error) throw new Error(error.message);

  await writeAuditLog({
    adminProfileId: adminId,
    action: "pricing.update",
    entityType: "pricing_config",
    entityId: id,
    metadata: updates,
  });
}
