import { jsonError, jsonSuccess } from "@/lib/api/response";
import {
  getVerificationState,
  startBackgroundScreening,
  startIdentityVerification,
} from "@/lib/cleaners/verification";
import { getProviderConnectionState } from "@/lib/cleaners/verification";
import { requireProfessionalSession } from "@/lib/pro/dashboard/session";

export async function GET() {
  try {
    const { profile } = await requireProfessionalSession();
    const state = await getVerificationState(profile.professionalId);
    return jsonSuccess({
      ...(state ?? {}),
      ...getProviderConnectionState(),
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

    if (action === "start_identity") {
      const state = await startIdentityVerification({
        professionalId: profile.professionalId,
        actorId: profile.id,
      });
      return jsonSuccess(state);
    }

    if (action === "start_background") {
      const state = await startBackgroundScreening({
        professionalId: profile.professionalId,
        actorId: profile.id,
      });
      return jsonSuccess(state);
    }

    return jsonError("Unknown verification action.", 400);
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Unable to update verification.",
      400,
    );
  }
}
