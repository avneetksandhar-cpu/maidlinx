import { jsonError, jsonSuccess } from "@/lib/api/response";
import { getCleanerOnboarding, updateStripeConnectState } from "@/lib/cleaners/onboarding-store";
import { requireProfessionalSession } from "@/lib/pro/dashboard/session";
import { createConnectOnboardingLink, refreshConnectAccountStatus } from "@/lib/stripe/connect";
import { siteConfig } from "@/config/site";

export async function GET() {
  try {
    const { profile } = await requireProfessionalSession();
    const record = await getCleanerOnboarding(profile.professionalId);
    if (!record) return jsonError("Cleaner not found.", 404);

    const snapshot = await refreshConnectAccountStatus(record.stripeConnectId);
    if (snapshot.status !== record.stripeConnectStatus || snapshot.accountId) {
      await updateStripeConnectState(profile.professionalId, {
        accountId: snapshot.accountId,
        status: snapshot.status,
      });
    }

    return jsonSuccess({
      status: snapshot.status,
      accountId: snapshot.accountId,
      chargesEnabled: snapshot.chargesEnabled,
      payoutsEnabled: snapshot.payoutsEnabled,
      detailsSubmitted: snapshot.detailsSubmitted,
      note: "Bank details are never collected in MaidLinx. Stripe Connect hosted onboarding only (TEST).",
    });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Authentication required.", 401);
  }
}

export async function POST() {
  try {
    const { profile, email } = await requireProfessionalSession();
    const record = await getCleanerOnboarding(profile.professionalId);
    if (!record) return jsonError("Cleaner not found.", 404);

    const base = siteConfig.url.replace(/\/$/, "");
    const result = await createConnectOnboardingLink({
      cleanerId: profile.professionalId,
      email,
      existingAccountId: record.stripeConnectId,
      refreshUrl: `${base}/cleaner/settings?connect=refresh`,
      returnUrl: `${base}/cleaner/settings?connect=return`,
    });

    if (!result.ok) {
      return jsonError(result.message, result.reason === "missing_secret" ? 503 : 400);
    }

    await updateStripeConnectState(profile.professionalId, {
      accountId: result.accountId,
      status: result.status,
    });

    return jsonSuccess({
      url: result.url,
      mode: result.mode,
      accountId: result.accountId,
      status: result.status,
    });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Unable to start Connect.", 400);
  }
}
