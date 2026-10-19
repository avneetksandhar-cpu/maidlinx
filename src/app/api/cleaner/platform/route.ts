import { jsonError, jsonSuccess } from "@/lib/api/response";
import {
  assertCleanerCanTakeJobs,
  loadGateDefinitions,
  markContactVerified,
} from "@/lib/cleaners/gates-store";
import { getTrustMetrics } from "@/lib/cleaners/trust";
import { parsePlatformStage } from "@/lib/cleaners/platform";
import { createAdminClient, hasAdminEnv } from "@/lib/supabase/admin";
import { requireProfessionalSession } from "@/lib/pro/dashboard/session";

export async function GET() {
  try {
    const { profile, email } = await requireProfessionalSession();
    const [gates, gateDefs, trust] = await Promise.all([
      assertCleanerCanTakeJobs(profile.professionalId),
      loadGateDefinitions(),
      getTrustMetrics(profile.professionalId),
    ]);

    let platformStage = trust?.platformStage ?? "APPLICANT";
    if (hasAdminEnv()) {
      const supabase = createAdminClient();
      const { data } = await supabase
        .from("professionals")
        .select("platform_stage")
        .eq("id", profile.professionalId)
        .maybeSingle();
      if (data) {
        platformStage = parsePlatformStage(
          (data as Record<string, unknown>).platform_stage,
        );
      }
    }

    return jsonSuccess({
      professionalId: profile.professionalId,
      email,
      platformStage,
      gates,
      gateDefinitions: gateDefs,
      trust,
      canTakeJobs: gates.allowed,
    });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Authentication required.", 401);
  }
}

/** Confirm phone/email from authenticated session (no homemade KYC). */
export async function POST(request: Request) {
  try {
    const { profile, email } = await requireProfessionalSession();
    const body = await request.json();
    const action = String(body?.action ?? "");

    if (action === "confirm_email") {
      if (!email) return jsonError("No email on session.", 400);
      await markContactVerified({ professionalId: profile.professionalId, email: true });
      return jsonSuccess({ emailVerified: true });
    }

    if (action === "confirm_phone") {
      if (!profile.phone) return jsonError("Add a phone number on your profile first.", 400);
      await markContactVerified({ professionalId: profile.professionalId, phone: true });
      return jsonSuccess({ phoneVerified: true });
    }

    return jsonError("Unknown action.", 400);
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Unable to update status.", 400);
  }
}
