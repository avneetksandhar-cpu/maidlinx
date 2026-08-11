import { jsonError, jsonSuccess } from "@/lib/api/response";
import {
  catalogServicesForUi,
  catalogZonesForUi,
  getCleanerCapabilities,
  updateCleanerCapabilities,
} from "@/lib/pro/dashboard/capabilities";
import { requireProfessionalSession } from "@/lib/pro/dashboard/session";
import { updateCapabilitiesSchema } from "@/lib/validations/pro-dashboard";

export async function GET() {
  try {
    const { profile } = await requireProfessionalSession();
    const capabilities = await getCleanerCapabilities(profile.id);
    return jsonSuccess({
      capabilities,
      catalog: {
        services: catalogServicesForUi(),
        zones: catalogZonesForUi(),
      },
    });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Unable to load capabilities.",
      401,
    );
  }
}

export async function PUT(request: Request) {
  try {
    const { profile } = await requireProfessionalSession();
    const body = await request.json();
    const parsed = updateCapabilitiesSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(parsed.error.errors[0]?.message ?? "Invalid capabilities.", 400);
    }

    const capabilities = await updateCleanerCapabilities(profile.id, parsed.data);
    return jsonSuccess({ capabilities });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to save capabilities.";
    return jsonError(message, message.includes("Authentication") ? 401 : 400);
  }
}
