import { jsonError, jsonSuccess } from "@/lib/api/response";
import { bulkDeactivateCoupons, createCoupon, listCoupons, toggleCoupon } from "@/lib/admin/coupons";
import { requireAdminApiPermission } from "@/lib/admin/session";
import { createCouponSchema } from "@/lib/validations/admin";

export async function GET() {
  try {
    await requireAdminApiPermission("coupons.write");
    const coupons = await listCoupons();
    return jsonSuccess({ coupons });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Unable to load coupons.", 403);
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdminApiPermission("coupons.write");
    const body = await request.json();

    if (body.action === "bulk_deactivate") {
      const count = await bulkDeactivateCoupons(admin.id, body.ids ?? []);
      return jsonSuccess({ updated: count });
    }

    const parsed = createCouponSchema.safeParse(body);
    if (!parsed.success) return jsonError(parsed.error.errors[0]?.message ?? "Invalid coupon.", 400);

    const coupon = await createCoupon(admin.id, {
      ...parsed.data,
      description: parsed.data.description ?? null,
      maxUses: parsed.data.maxUses ?? null,
      validFrom: parsed.data.validFrom ?? null,
      validUntil: parsed.data.validUntil ?? null,
    });
    return jsonSuccess({ coupon }, 201);
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Action failed.", 400);
  }
}

export async function PATCH(request: Request) {
  try {
    const admin = await requireAdminApiPermission("coupons.write");
    const body = await request.json();
    if (!body.id) return jsonError("id required.", 400);
    await toggleCoupon(admin.id, body.id, Boolean(body.isActive));
    return jsonSuccess({ updated: true });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Update failed.", 400);
  }
}
