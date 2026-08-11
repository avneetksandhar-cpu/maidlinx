import { jsonError, jsonSuccess } from "@/lib/api/response";
import { updateProfessionalProfile } from "@/lib/professionals/repository";
import { requireProfessionalSession } from "@/lib/pro/dashboard/session";
import { updateProProfileSchema } from "@/lib/validations/pro-dashboard";

export async function GET() {
  try {
    const { profile } = await requireProfessionalSession();
    return jsonSuccess({ profile });
  } catch {
    return jsonError("Authentication required.", 401);
  }
}

export async function PATCH(request: Request) {
  try {
    const { profile } = await requireProfessionalSession();
    const body = await request.json();
    const parsed = updateProProfileSchema.safeParse(body);

    if (!parsed.success) {
      return jsonError(parsed.error.errors[0]?.message ?? "Invalid profile.", 400);
    }

    await updateProfessionalProfile(profile.id, profile.professionalId, {
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      phone: parsed.data.phone || null,
      bio: parsed.data.bio,
      yearsExperience: parsed.data.yearsExperience,
      serviceRadiusKm: parsed.data.serviceRadiusKm,
    });

    return jsonSuccess({ updated: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to save profile.";
    return jsonError(message, 400);
  }
}
