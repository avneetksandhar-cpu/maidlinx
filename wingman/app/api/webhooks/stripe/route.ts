import { NextResponse } from "next/server";
import { loadStripeReceiptHint, persistReceiptHint } from "@/lib/account/stripe-receipt";
import { getPool } from "@/lib/db";
import { confirmPaidRequest } from "@/lib/marketplace/service";
import { confirmPaidOrder, markOrderFailed, markOrderRefunded } from "@/lib/orders/confirm";
import { readStripeEnv } from "@/lib/payments/env";
import { applyStripeWebhookEvent } from "@/lib/payments/webhook";
import { getStripeClient } from "@/services/stripe";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const env = readStripeEnv();
  if (!env.ok) {
    return NextResponse.json({ error: env.error }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature." }, { status: 400 });
  }

  const raw = await request.text();
  let event: { id: string; type: string; data: { object: Record<string, unknown> } };
  try {
    const stripe = getStripeClient();
    event = stripe.webhooks.constructEvent(raw, signature, env.value.webhookSecret) as unknown as typeof event;
  } catch {
    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 400 });
  }

  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT set_config($1, $2, true)", ["app.role", "owner"]);
    const seen = await client.query("SELECT event_id FROM stripe_webhook_events WHERE event_id = $1", [
      event.id,
    ]);
    const result = applyStripeWebhookEvent({
      eventId: event.id,
      type: event.type,
      alreadyProcessed: seen.rows.length > 0,
      checkoutSessionId: typeof event.data.object.id === "string" ? event.data.object.id : null,
      paymentIntentId:
        typeof event.data.object.payment_intent === "string"
          ? event.data.object.payment_intent
          : null,
      refundedCents:
        typeof event.data.object.amount_refunded === "number" ? event.data.object.amount_refunded : 0,
    });

    if (result.duplicate) {
      await client.query("COMMIT");
      return NextResponse.json({ ok: true, duplicate: true });
    }

    await client.query(
      "INSERT INTO stripe_webhook_events (event_id, event_type) VALUES ($1, $2) ON CONFLICT (event_id) DO NOTHING",
      [event.id, event.type],
    );

    const metadata = (event.data.object.metadata ?? {}) as Record<string, string>;
    const requestId = metadata.requestId;
    const orderId = metadata.orderId;
    const sessionId = typeof event.data.object.id === "string" ? event.data.object.id : null;

    if (result.applied && result.nextStatus === "paid" && (orderId || requestId)) {
      if (orderId) {
        await confirmPaidOrder(client, orderId, result.paymentIntentId ?? null);
      } else if (requestId) {
        await confirmPaidRequest(client, requestId, result.paymentIntentId ?? null);
      }
      if (sessionId) {
        await client.query(
          `UPDATE payments
           SET status = 'paid', stripe_payment_intent_id = $2, updated_at = now()
           WHERE stripe_checkout_session_id = $1`,
          [sessionId, result.paymentIntentId ?? null],
        );
      }
      const customerFromEvent =
        typeof event.data.object.customer === "string" ? event.data.object.customer : null;
      const hint = sessionId
        ? await loadStripeReceiptHint(sessionId)
        : { last4: null, brand: null, receiptUrl: null, customerId: customerFromEvent };
      await persistReceiptHint(client, {
        checkoutSessionId: sessionId,
        paymentIntentId: result.paymentIntentId ?? null,
        hint: { ...hint, customerId: hint.customerId ?? customerFromEvent },
        userId: metadata.userId ?? null,
      });
    }

    if (result.applied && result.nextStatus === "refunded" && (orderId || requestId)) {
      if (orderId) {
        await markOrderRefunded(client, orderId, result.refundedCents ?? 0);
      } else if (requestId) {
        await client.query(
          `UPDATE booking_requests SET status = 'refunded', updated_at = now() WHERE id = $1`,
          [requestId],
        );
        await client.query(
          `UPDATE payments SET status = 'refunded', refunded_cents = $2, updated_at = now()
           WHERE request_id = $1`,
          [requestId, result.refundedCents ?? 0],
        );
      }
    }

    if (!result.applied && result.nextStatus === "payment_failed" && (orderId || requestId)) {
      if (orderId) {
        await markOrderFailed(client, orderId);
      } else if (requestId) {
        await client.query(
          `UPDATE payments SET status = 'failed', updated_at = now()
           WHERE request_id = $1 AND status = 'checkout_created'`,
          [requestId],
        );
      }
      await client.query(
        `INSERT INTO audit_events (actor_id, entity_type, entity_id, action, from_state, to_state, payload)
         VALUES (NULL, 'payment', $1, 'payment_failed', 'payment_pending', 'payment_failed', '{}'::jsonb)`,
        [orderId ?? requestId],
      );
    }

    if (result.applied && result.nextStatus === "disputed" && requestId) {
      await client.query(
        `UPDATE booking_requests SET status = 'disputed', updated_at = now() WHERE id = $1`,
        [requestId],
      );
      await client.query(
        `UPDATE payments SET dispute_status = $2, updated_at = now() WHERE request_id = $1`,
        [requestId, result.disputeStatus],
      );
    }

    await client.query("COMMIT");
    return NextResponse.json({ ok: true, applied: result.applied, status: result.nextStatus });
  } catch (error) {
    await client.query("ROLLBACK");
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Webhook failed." },
      { status: 500 },
    );
  } finally {
    client.release();
  }
}
