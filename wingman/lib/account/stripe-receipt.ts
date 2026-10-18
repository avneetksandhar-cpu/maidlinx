import type { PoolClient } from "pg";
import { readStripeEnv } from "@/lib/payments/env";
import { getStripeClient } from "@/services/stripe";

export type StripeReceiptHint = {
  last4: string | null;
  brand: string | null;
  receiptUrl: string | null;
  customerId: string | null;
};

export async function loadStripeReceiptHint(
  checkoutSessionId: string | null,
): Promise<StripeReceiptHint> {
  const empty: StripeReceiptHint = {
    last4: null,
    brand: null,
    receiptUrl: null,
    customerId: null,
  };
  if (!checkoutSessionId) return empty;
  const env = readStripeEnv();
  if (!env.ok) return empty;
  try {
    const stripe = getStripeClient();
    const session = await stripe.checkout.sessions.retrieve(checkoutSessionId, {
      expand: ["payment_intent.latest_charge"],
    });
    const intent = session.payment_intent;
    const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id ?? null;
    if (!intent || typeof intent === "string") {
      return { ...empty, customerId };
    }
    const charge = intent.latest_charge;
    if (!charge || typeof charge === "string") {
      return { ...empty, customerId };
    }
    const card = charge.payment_method_details?.card;
    return {
      last4: card?.last4 ?? null,
      brand: card?.brand ?? null,
      receiptUrl: charge.receipt_url ?? null,
      customerId,
    };
  } catch {
    return empty;
  }
}

export async function persistReceiptHint(
  client: PoolClient,
  args: {
    checkoutSessionId: string | null;
    paymentIntentId: string | null;
    hint: StripeReceiptHint;
    userId?: string | null;
  },
): Promise<void> {
  if (!args.checkoutSessionId && !args.paymentIntentId) return;
  await client.query(
    `UPDATE payments
     SET card_last4 = COALESCE($3, card_last4),
         card_brand = COALESCE($4, card_brand),
         receipt_url = COALESCE($5, receipt_url),
         stripe_customer_id = COALESCE($6, stripe_customer_id),
         stripe_payment_intent_id = COALESCE($2, stripe_payment_intent_id),
         updated_at = now()
     WHERE stripe_checkout_session_id = $1
        OR ($2 IS NOT NULL AND stripe_payment_intent_id = $2)`,
    [
      args.checkoutSessionId,
      args.paymentIntentId,
      args.hint.last4,
      args.hint.brand,
      args.hint.receiptUrl,
      args.hint.customerId,
    ],
  );
  if (args.userId && args.hint.customerId) {
    await client.query(
      `UPDATE profiles
       SET stripe_customer_id = COALESCE(stripe_customer_id, $2),
           updated_at = now()
       WHERE id = $1`,
      [args.userId, args.hint.customerId],
    );
  }
}

export async function listStripeCardMethods(customerId: string | null): Promise<
  Array<{ id: string; brand: string | null; last4: string | null; expMonth: number | null; expYear: number | null }>
> {
  if (!customerId) return [];
  const env = readStripeEnv();
  if (!env.ok) return [];
  try {
    const stripe = getStripeClient();
    const methods = await stripe.paymentMethods.list({
      customer: customerId,
      type: "card",
    });
    return methods.data.map((method) => ({
      id: method.id,
      brand: method.card?.brand ?? null,
      last4: method.card?.last4 ?? null,
      expMonth: method.card?.exp_month ?? null,
      expYear: method.card?.exp_year ?? null,
    }));
  } catch {
    return [];
  }
}
