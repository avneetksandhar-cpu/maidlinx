import { jsonError, jsonSuccess } from "@/lib/api/response";
import { getAuditHistory } from "@/lib/admin/audit";
import { getSystemLogs } from "@/lib/admin/audit";
import { listAdminUsers, updateAdminPermissions } from "@/lib/admin/permissions-store";
import { requireAdminApiPermission } from "@/lib/admin/session";
import { updatePermissionsSchema } from "@/lib/validations/admin";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");

    if (type === "audit") {
      await requireAdminApiPermission("audit.read");
      const entries = await getAuditHistory();
      return jsonSuccess({ entries });
    }

    if (type === "logs") {
      await requireAdminApiPermission("logs.read");
      const logs = await getSystemLogs();
      return jsonSuccess({ logs });
    }

    if (type === "permissions") {
      await requireAdminApiPermission("permissions.write");
      const admins = await listAdminUsers();
      return jsonSuccess({ admins });
    }

    return jsonError("Invalid type.", 400);
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Unable to load.", 403);
  }
}

export async function PATCH(request: Request) {
  try {
    const admin = await requireAdminApiPermission("permissions.write");
    const body = await request.json();
    const parsed = updatePermissionsSchema.safeParse(body);
    if (!parsed.success) return jsonError("Invalid permissions update.", 400);

    await updateAdminPermissions(
      admin.id,
      parsed.data.targetProfileId,
      parsed.data.roleLabel,
      parsed.data.permissions as never[],
    );
    return jsonSuccess({ updated: true });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Update failed.", 400);
  }
}
