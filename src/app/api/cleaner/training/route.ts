import { jsonError, jsonSuccess } from "@/lib/api/response";
import {
  completeAcademyModule,
  getTrainingProgress,
  publicAssessmentQuestions,
  submitAssessment,
} from "@/lib/cleaners/training";
import { requireProfessionalSession } from "@/lib/pro/dashboard/session";

export async function GET() {
  try {
    const { profile } = await requireProfessionalSession();
    const progress = await getTrainingProgress(profile.professionalId);
    return jsonSuccess({
      ...progress,
      assessment: publicAssessmentQuestions(),
    });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Authentication required.", 401);
  }
}

export async function POST(request: Request) {
  try {
    const { profile } = await requireProfessionalSession();
    const body = await request.json();
    const action = String(body?.action ?? "");

    if (action === "complete_module") {
      const moduleId = String(body?.moduleId ?? "");
      if (!moduleId) return jsonError("moduleId required.", 400);
      const progress = await completeAcademyModule({
        cleanerId: profile.professionalId,
        moduleId,
        actorId: profile.id,
      });
      return jsonSuccess(progress);
    }

    if (action === "submit_assessment") {
      const answers = (body?.answers ?? {}) as Record<string, string>;
      const result = await submitAssessment({
        cleanerId: profile.professionalId,
        actorId: profile.id,
        answers,
      });
      return jsonSuccess(result);
    }

    return jsonError("Unknown training action.", 400);
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Unable to update training.", 400);
  }
}
