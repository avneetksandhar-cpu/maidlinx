import { jsonError, jsonSuccess } from "@/lib/api/response";
import { requireCustomerSession } from "@/lib/dashboard/session";
import {
  captureReferralAttribution,
  ensureReferralCode,
  ReferralError,
  REFERRAL_CREDITS_LIVE,
} from "@/lib/referrals";
import { z } from "zod";

export async function GET() {
  try {
    const { profile } = await requireCustomerSession();
    const code = await ensureReferralCode(profile.id);
    return jsonSuccess({
      code,
      creditsLive: REFERRAL_CREDITS_LIVE,
      message: REFERRAL_CREDITS_LIVE
        ? "Referral credits are active."
        : "Referral credits are not live — Product + accounting approval required.",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load referral code.";
    return jsonError(message, message.includes("Authentication") ? 401 : 400);
  }
}

const captureSchema = z.object({
  code: z.string().trim().min(3).max(32),
  bookingId: z.string().uuid().optional(),
});

/** Capture only — never grants credits while creditsLive is false. */
export async function POST(request: Request) {
  try {
    const { profile, email } = await requireCustomerSession();
    const body = await request.json();
    const parsed = captureSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(parsed.error.errors[0]?.message ?? "Invalid referral payload.", 400);
    }

    const result = await captureReferralAttribution({
      code: parsed.data.code,
      refereeProfileId: profile.id,
      refereeEmail: email,
      bookingId: parsed.data.bookingId ?? null,
    });

    return jsonSuccess({ ...result, creditsLive: REFERRAL_CREDITS_LIVE });
  } catch (error) {
    if (error instanceof ReferralError) {
      return jsonError(error.message, 400, "REFERRAL_INVALID");
    }
    const message = error instanceof Error ? error.message : "Unable to capture referral.";
    return jsonError(message, message.includes("Authentication") ? 401 : 400);
  }
}
