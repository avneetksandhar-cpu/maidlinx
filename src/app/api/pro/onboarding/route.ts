import { jsonError, jsonSuccess } from "@/lib/api/response";
import {
  getCleanerOnboarding,
  markOnboardingStep,
  submitCleanerOnboarding,
} from "@/lib/cleaners/onboarding-store";
import { checklistProgress } from "@/lib/cleaners/onboarding";
import { requireProfessionalSession } from "@/lib/pro/dashboard/session";
import {
  onboardingStepSchema,
  onboardingSubmitSchema,
} from "@/lib/validations/pro-dashboard";

export async function GET() {
  try {
    const { profile } = await requireProfessionalSession();
    const record = await getCleanerOnboarding(profile.professionalId);
    if (!record) return jsonError("Onboarding record not found.", 404);
    return jsonSuccess({
      ...record,
      progress: checklistProgress(record.checklist),
    });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Authentication required.", 401);
  }
}

export async function PATCH(request: Request) {
  try {
    const { profile } = await requireProfessionalSession();
    const body = await request.json();

    if (body?.action === "submit") {
      const parsed = onboardingSubmitSchema.safeParse(body);
      if (!parsed.success) return jsonError("Invalid submit payload.", 400);
      const record = await submitCleanerOnboarding(profile.professionalId);
      return jsonSuccess({
        ...record,
        progress: checklistProgress(record.checklist),
      });
    }

    const parsed = onboardingStepSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(parsed.error.errors[0]?.message ?? "Invalid onboarding step.", 400);
    }

    const record = await markOnboardingStep(
      profile.professionalId,
      parsed.data.step,
      parsed.data.complete,
      {
        marketId: parsed.data.marketId,
        languages: parsed.data.languages,
        transportation: parsed.data.transportation,
        acceptAgreements: parsed.data.acceptAgreements,
      },
    );

    return jsonSuccess({
      ...record,
      progress: checklistProgress(record.checklist),
    });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Unable to update onboarding.", 400);
  }
}
