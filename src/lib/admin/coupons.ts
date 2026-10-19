import { createAdminClient } from "@/lib/supabase/admin";
import { writeAuditLog } from "@/lib/admin/audit";

export interface Coupon {
  id: string;
  code: string;
  description: string | null;
  discountType: "percent" | "fixed";
  discountValue: number;
  minOrderCents: number;
  maxUses: number | null;
  maxUsesPerCustomer?: number | null;
  usedCount: number;
  validFrom: string | null;
  validUntil: string | null;
  isActive: boolean;
  createdAt: string;
}

export async function listCoupons(): Promise<Coupon[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from("coupons").select("*").order("created_at", { ascending: false });

  if (error) {
    if (error.message.includes("coupons")) return [];
    throw new Error(error.message);
  }

  return (data ?? []).map(mapCoupon);
}

function mapCoupon(row: Record<string, unknown>): Coupon {
  return {
    id: String(row.id),
    code: String(row.code),
    description: row.description ? String(row.description) : null,
    discountType: row.discount_type as "percent" | "fixed",
    discountValue: Number(row.discount_value),
    minOrderCents: Number(row.min_order_cents),
    maxUses: row.max_uses ? Number(row.max_uses) : null,
    maxUsesPerCustomer:
      row.max_uses_per_customer != null ? Number(row.max_uses_per_customer) : null,
    usedCount: Number(row.used_count),
    validFrom: row.valid_from ? String(row.valid_from) : null,
    validUntil: row.valid_until ? String(row.valid_until) : null,
    isActive: Boolean(row.is_active),
    createdAt: String(row.created_at),
  };
}

export async function createCoupon(
  adminId: string,
  input: Omit<Coupon, "id" | "usedCount" | "createdAt">,
): Promise<Coupon> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("coupons")
    .insert({
      code: input.code.toUpperCase(),
      description: input.description,
      discount_type: input.discountType,
      discount_value: input.discountValue,
      min_order_cents: input.minOrderCents,
      max_uses: input.maxUses,
      max_uses_per_customer: input.maxUsesPerCustomer ?? null,
      valid_from: input.validFrom,
      valid_until: input.validUntil,
      is_active: input.isActive,
      created_by: adminId,
    } as never)
    .select("*")
    .single();

  if (error || !data) throw new Error(error?.message ?? "Failed to create coupon.");

  await writeAuditLog({
    adminProfileId: adminId,
    action: "coupon.create",
    entityType: "coupon",
    entityId: String(data.id),
    metadata: { code: input.code },
  });

  return mapCoupon(data as Record<string, unknown>);
}

export async function toggleCoupon(adminId: string, id: string, isActive: boolean): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase.from("coupons").update({ is_active: isActive }).eq("id", id);
  if (error) throw new Error(error.message);

  await writeAuditLog({
    adminProfileId: adminId,
    action: "coupon.toggle",
    entityType: "coupon",
    entityId: id,
    metadata: { isActive },
  });
}

export async function bulkDeactivateCoupons(adminId: string, ids: string[]): Promise<number> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("coupons")
    .update({ is_active: false })
    .in("id", ids)
    .select("id");

  if (error) throw new Error(error.message);

  await writeAuditLog({
    adminProfileId: adminId,
    action: "coupons.bulk_deactivate",
    entityType: "coupon",
    metadata: { ids, count: data?.length ?? 0 },
  });

  return data?.length ?? 0;
}
