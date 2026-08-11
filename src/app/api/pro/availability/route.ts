import { jsonError, jsonSuccess } from "@/lib/api/response";
import { getAvailability, updateAvailability } from "@/lib/pro/dashboard/availability";
import { requireProfessionalSession } from "@/lib/pro/dashboard/session";
import { availabilitySchema } from "@/lib/validations/pro-dashboard";

export async function GET() {
  try {
    const { profile } = await requireProfessionalSession();
    const slots = await getAvailability(profile.id);
    return jsonSuccess({ slots });
  } catch (error) {
    return jsonError("Authentication required.", 401);
  }
}

export async function PUT(request: Request) {
  try {
    const { profile } = await requireProfessionalSession();
    const body = await request.json();
    const parsed = availabilitySchema.safeParse(body);

    if (!parsed.success) {
      return jsonError(parsed.error.errors[0]?.message ?? "Invalid availability.", 400);
    }

    await updateAvailability(profile.id, parsed.data.slots);
    return jsonSuccess({ updated: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to save availability.";
    return jsonError(message, 400);
  }
}
