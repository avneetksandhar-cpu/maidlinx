import { jsonError, jsonSuccess } from "@/lib/api/response";
import { assertCanGoOnline, setCleanerOnlineStatus } from "@/lib/cleaners/presence";
import { requireProfessionalSession } from "@/lib/pro/dashboard/session";
import { presenceSchema } from "@/lib/validations/pro-dashboard";

export async function PATCH(request: Request) {
  try {
    const { profile } = await requireProfessionalSession();
    const body = await request.json();
    const parsed = presenceSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(parsed.error.errors[0]?.message ?? "Invalid presence payload.", 400);
    }

    if (parsed.data.isOnline) {
      assertCanGoOnline(profile.onboardingStatus);
    }

    const result = await setCleanerOnlineStatus(profile.professionalId, parsed.data.isOnline);
    return jsonSuccess(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update presence.";
    return jsonError(message, 400);
  }
}
