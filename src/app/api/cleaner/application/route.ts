import { jsonError, jsonSuccess } from "@/lib/api/response";
import {
  cleanerApplicationSchema,
  getCleanerApplication,
  saveCleanerApplication,
} from "@/lib/cleaners/application";
import { requireProfessionalSession } from "@/lib/pro/dashboard/session";

export async function GET() {
  try {
    const { profile } = await requireProfessionalSession();
    const application = await getCleanerApplication(profile.professionalId);
    return jsonSuccess({ application });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Authentication required.", 401);
  }
}

export async function PUT(request: Request) {
  try {
    const { profile } = await requireProfessionalSession();
    const body = await request.json();
    const submit = Boolean(body?.submit);
    const parsed = cleanerApplicationSchema.safeParse(body?.application ?? body);
    if (!parsed.success) {
      return jsonError(parsed.error.errors[0]?.message ?? "Invalid application.", 400);
    }

    const result = await saveCleanerApplication({
      professionalId: profile.professionalId,
      actorId: profile.id,
      application: parsed.data,
      submit,
    });

    return jsonSuccess(result);
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Unable to save application.", 400);
  }
}
