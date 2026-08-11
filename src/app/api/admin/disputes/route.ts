import { jsonError, jsonSuccess } from "@/lib/api/response";
import { listDisputes, updateDispute } from "@/lib/admin/disputes";
import { requireAdminApiPermission } from "@/lib/admin/session";
import { updateDisputeSchema } from "@/lib/validations/admin";

export async function GET(request: Request) {
  try {
    await requireAdminApiPermission("disputes.write");
    const status = new URL(request.url).searchParams.get("status") ?? undefined;
    const disputes = await listDisputes(status ?? undefined);
    return jsonSuccess({ disputes });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Unable to load disputes.", 403);
  }
}

export async function PATCH(request: Request) {
  try {
    const admin = await requireAdminApiPermission("disputes.write");
    const body = await request.json();
    const { id, ...updates } = body;
    const parsed = updateDisputeSchema.safeParse(updates);
    if (!id || !parsed.success) return jsonError("Invalid update.", 400);

    await updateDispute(admin.id, id, parsed.data);
    return jsonSuccess({ updated: true });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Update failed.", 400);
  }
}
