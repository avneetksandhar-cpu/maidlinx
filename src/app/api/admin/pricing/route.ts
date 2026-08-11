import { jsonError, jsonSuccess } from "@/lib/api/response";
import { listPricingRules, updatePricingRule } from "@/lib/admin/pricing";
import { requireAdminApiPermission } from "@/lib/admin/session";
import { updatePricingSchema } from "@/lib/validations/admin";

export async function GET() {
  try {
    await requireAdminApiPermission("pricing.write");
    const rules = await listPricingRules();
    return jsonSuccess({ rules });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Unable to load pricing.", 403);
  }
}

export async function PATCH(request: Request) {
  try {
    const admin = await requireAdminApiPermission("pricing.write");
    const body = await request.json();
    const { id, ...updates } = body;
    const parsed = updatePricingSchema.safeParse(updates);

    if (!id || !parsed.success) return jsonError("Invalid pricing update.", 400);

    await updatePricingRule(admin.id, id, parsed.data);
    return jsonSuccess({ updated: true });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Update failed.", 400);
  }
}
