export type PaymentRecord = {
  id: string;
  stripeEventId: string | null;
  stripeCheckoutSessionId: string | null;
  stripePaymentIntentId: string | null;
  status: string;
  refundedCents: number;
  disputeStatus: string | null;
};

export type WebhookApplyResult = {
  applied: boolean;
  duplicate: boolean;
  nextStatus: string;
  paymentIntentId?: string;
  checkoutSessionId?: string;
  refundedCents?: number;
  disputeStatus?: string | null;
};

export function applyStripeWebhookEvent(args: {
  eventId: string;
  type: string;
  alreadyProcessed: boolean;
  checkoutSessionId?: string | null;
  paymentIntentId?: string | null;
  refundedCents?: number;
}): WebhookApplyResult {
  if (args.alreadyProcessed) {
    return { applied: false, duplicate: true, nextStatus: "unchanged" };
  }

  switch (args.type) {
    case "checkout.session.completed":
    case "payment_intent.succeeded":
      return {
        applied: true,
        duplicate: false,
        nextStatus: "paid",
        paymentIntentId: args.paymentIntentId ?? undefined,
        checkoutSessionId: args.checkoutSessionId ?? undefined,
      };
    case "charge.refunded":
    case "refund.created":
      return {
        applied: true,
        duplicate: false,
        nextStatus: "refunded",
        refundedCents: args.refundedCents ?? 0,
      };
    case "charge.dispute.created":
      return {
        applied: true,
        duplicate: false,
        nextStatus: "disputed",
        disputeStatus: "open",
      };
    case "charge.dispute.closed":
      return {
        applied: true,
        duplicate: false,
        nextStatus: "disputed",
        disputeStatus: "closed",
      };
    case "payment_intent.payment_failed":
    case "checkout.session.expired":
    case "checkout.session.async_payment_failed":
      return {
        applied: false,
        duplicate: false,
        nextStatus: "payment_failed",
      };
    default:
      return { applied: false, duplicate: false, nextStatus: "ignored" };
  }
}
