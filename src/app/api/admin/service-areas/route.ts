import { jsonError, jsonSuccess } from "@/lib/api/response";
import { createServiceArea, listServiceAreas, toggleServiceArea } from "@/lib/admin/service-areas";
import { requireAdminApiPermission } from "@/lib/admin/session";
import { createServiceAreaSchema } from "@/lib/validations/admin";

export async function GET() {
  try {
    await requireAdminApiPermission("service_areas.write");
    const areas = await listServiceAreas();
    return jsonSuccess({ areas });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Unable to load areas.", 403);
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdminApiPermission("service_areas.write");
    const body = await request.json();
    const parsed = createServiceAreaSchema.safeParse(body);
    if (!parsed.success) return jsonError("Invalid service area.", 400);

    const area = await createServiceArea(admin.id, parsed.data);
    return jsonSuccess({ area }, 201);
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Create failed.", 400);
  }
}

export async function PATCH(request: Request) {
  try {
    const admin = await requireAdminApiPermission("service_areas.write");
    const body = await request.json();
    if (!body.id) return jsonError("id required.", 400);
    await toggleServiceArea(admin.id, body.id, Boolean(body.isActive));
    return jsonSuccess({ updated: true });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Update failed.", 400);
  }
}
