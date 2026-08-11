/**
 * Stripe Connect (Express) architecture stubs — TEST mode only.
 * Never collects bank account numbers in-app; hosted onboarding only.
 * Live mode / real Account Links require Dashboard Connect setup + secrets.
 */

import type { StripeConnectStatus } from "@/lib/cleaners/onboarding";

export type ConnectOnboardingResult =
  | {
      ok: true;
      mode: "stub" | "test";
      accountId: string;
      url: string;
      status: StripeConnectStatus;
    }
  | {
      ok: false;
      reason: "missing_secret" | "not_configured" | "error";
      message: string;
    };

export interface ConnectAccountSnapshot {
  accountId: string | null;
  status: StripeConnectStatus;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
}

/** Map Stripe account flags → MaidLinx Connect status machine. */
export function deriveConnectStatus(flags: {
  detailsSubmitted?: boolean;
  chargesEnabled?: boolean;
  payoutsEnabled?: boolean;
  disabledReason?: string | null;
}): StripeConnectStatus {
  if (flags.disabledReason) return "RESTRICTED";
  if (flags.chargesEnabled && flags.payoutsEnabled) return "ENABLED";
  if (flags.detailsSubmitted || flags.chargesEnabled || flags.payoutsEnabled) {
    return "PENDING";
  }
  return "NOT_STARTED";
}

/**
 * Create (or reuse) a Connect Express account + Account Link.
 * When STRIPE_SECRET_KEY is absent, returns a deterministic stub for UI wiring.
 */
export async function createConnectOnboardingLink(input: {
  cleanerId: string;
  email: string;
  existingAccountId?: string | null;
  refreshUrl: string;
  returnUrl: string;
}): Promise<ConnectOnboardingResult> {
  const secret = process.env.STRIPE_SECRET_KEY?.trim();
  if (!secret) {
    return {
      ok: false,
      reason: "missing_secret",
      message:
        "Stripe TEST secret is not configured. Add STRIPE_SECRET_KEY locally to enable Connect Account Links.",
    };
  }

  // Architecture stub: do not call Stripe Connect until platform settings are ready.
  // Callers should treat this as not_configured and show “Connect payouts (TEST)” CTA copy.
  if (process.env.STRIPE_CONNECT_ENABLED !== "true") {
    const stubAccountId =
      input.existingAccountId?.trim() || `acct_stub_${input.cleanerId.replace(/-/g, "").slice(0, 16)}`;
    return {
      ok: true,
      mode: "stub",
      accountId: stubAccountId,
      url: `${input.returnUrl}?connect=stub&account=${encodeURIComponent(stubAccountId)}`,
      status: "PENDING",
    };
  }

  try {
    const { getStripeServer } = await import("@/lib/stripe/server");
    const stripe = getStripeServer();

    let accountId = input.existingAccountId?.trim() || null;
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: "express",
        email: input.email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        metadata: { cleaner_id: input.cleanerId },
      });
      accountId = account.id;
    }

    const link = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: input.refreshUrl,
      return_url: input.returnUrl,
      type: "account_onboarding",
    });

    return {
      ok: true,
      mode: "test",
      accountId,
      url: link.url,
      status: "PENDING",
    };
  } catch (error) {
    return {
      ok: false,
      reason: "error",
      message: error instanceof Error ? error.message : "Unable to start Connect onboarding.",
    };
  }
}

/** Refresh Connect status from Stripe (TEST). Stub returns PENDING when disabled. */
export async function refreshConnectAccountStatus(
  accountId: string | null | undefined,
): Promise<ConnectAccountSnapshot> {
  if (!accountId) {
    return {
      accountId: null,
      status: "NOT_STARTED",
      chargesEnabled: false,
      payoutsEnabled: false,
      detailsSubmitted: false,
    };
  }

  if (process.env.STRIPE_CONNECT_ENABLED !== "true" || !process.env.STRIPE_SECRET_KEY?.trim()) {
    return {
      accountId,
      status: accountId.startsWith("acct_stub_") ? "PENDING" : "NOT_STARTED",
      chargesEnabled: false,
      payoutsEnabled: false,
      detailsSubmitted: false,
    };
  }

  try {
    const { getStripeServer } = await import("@/lib/stripe/server");
    const account = await getStripeServer().accounts.retrieve(accountId);
    const status = deriveConnectStatus({
      detailsSubmitted: account.details_submitted,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      disabledReason: account.requirements?.disabled_reason ?? null,
    });
    return {
      accountId,
      status,
      chargesEnabled: Boolean(account.charges_enabled),
      payoutsEnabled: Boolean(account.payouts_enabled),
      detailsSubmitted: Boolean(account.details_submitted),
    };
  } catch {
    return {
      accountId,
      status: "RESTRICTED",
      chargesEnabled: false,
      payoutsEnabled: false,
      detailsSubmitted: false,
    };
  }
}
