import { calculateDepositCents, getDepositPercent } from "@/lib/payments/deposit";

/**
 * Pay-after-cleaning model (founder-approved for Stripe TEST).
 * Consent/save card at request → charge agreed total once when clean completes.
 * NEVER enable on Stripe LIVE keys without explicit founder RED approval.
 */
export function isStripeLiveKey(): boolean {
  const key = process.env.STRIPE_SECRET_KEY ?? "";
  return key.startsWith("sk_live");
}

/** Pay-after is ON for TEST (default). Forced OFF when LIVE keys are present. */
export function isPayAfterCleaningEnabled(): boolean {
  if (isStripeLiveKey()) return false;
  const flag = process.env.PAY_AFTER_CLEANING ?? process.env.NEXT_PUBLIC_PAY_AFTER_CLEANING;
  if (flag === "false" || flag === "0") return false;
  return true;
}

export type PaymentTimingModel = "pay_after_cleaning" | "deposit_upfront";

export function getPaymentTimingModel(): PaymentTimingModel {
  return isPayAfterCleaningEnabled() ? "pay_after_cleaning" : "deposit_upfront";
}

/** Amount charged at request time under the active model. */
export function getDueNowCents(totalCents: number): number {
  if (isPayAfterCleaningEnabled()) return 0;
  return calculateDepositCents(totalCents);
}

/** Amount remaining after request (charged after clean under pay-after). */
export function getDueLaterCents(totalCents: number): number {
  if (isPayAfterCleaningEnabled()) return Math.max(0, totalCents);
  return Math.max(0, totalCents - calculateDepositCents(totalCents));
}

export function getPaymentTimingCopy(totalCents: number): {
  model: PaymentTimingModel;
  dueNowCents: number;
  dueLaterCents: number;
  depositPercent: number;
  requestHeadline: string;
  requestDetail: string;
} {
  const model = getPaymentTimingModel();
  const dueNowCents = getDueNowCents(totalCents);
  const dueLaterCents = getDueLaterCents(totalCents);
  const depositPercent = getDepositPercent();

  if (model === "pay_after_cleaning") {
    return {
      model,
      dueNowCents,
      dueLaterCents,
      depositPercent: 0,
      requestHeadline: "Card saved · charged after your clean",
      requestDetail:
        "Stripe TEST: we save your payment method now and charge the agreed total once when cleaning is marked complete. Nothing is charged at request.",
    };
  }

  return {
    model,
    dueNowCents,
    dueLaterCents,
    depositPercent,
    requestHeadline: `${depositPercent}% deposit due today`,
    requestDetail:
      "We charge a deposit now to hold your booking; the remaining balance is due after the job.",
  };
}

export const COMPLETION_PAYMENT_TYPE = "completion" as const;
export const SETUP_PAYMENT_TYPE = "setup" as const;

export function completionChargeIdempotencyKey(bookingId: string, totalCents: number): string {
  return `maidlinx_complete_charge_${bookingId}_${totalCents}`;
}

export function setupIntentIdempotencyKey(bookingId: string): string {
  return `maidlinx_setup_${bookingId}`;
}
