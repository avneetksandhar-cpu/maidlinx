import type { PoolClient } from "pg";
import { writeAudit } from "@/lib/marketplace/audit";
import { confirmPaidRequest } from "@/lib/marketplace/service";

export async function confirmPaidOrder(
  client: PoolClient,
  orderId: string,
  paymentIntentId: string | null,
) {
  const items = await client.query<{ request_id: string }>(
    `SELECT request_id FROM order_items WHERE order_id = $1 AND request_id IS NOT NULL`,
    [orderId],
  );
  for (const item of items.rows) {
    await confirmPaidRequest(client, item.request_id, paymentIntentId);
  }
  await client.query(
    `UPDATE order_items SET status = 'confirmed' WHERE order_id = $1`,
    [orderId],
  );
  await client.query(
    `UPDATE orders SET status = 'paid', paid_at = now(), updated_at = now() WHERE id = $1`,
    [orderId],
  );
  await writeAudit(client, {
    actorId: null,
    entityType: "order",
    entityId: orderId,
    action: "payment_confirmed",
    toState: "paid",
    payload: { paymentIntentId, itemCount: items.rows.length },
  });
}

export async function markOrderFailed(client: PoolClient, orderId: string) {
  await client.query(
    `UPDATE payments SET status = 'failed', updated_at = now()
     WHERE order_id = $1 AND status = 'checkout_created'`,
    [orderId],
  );
  await client.query(
    `UPDATE booking_requests SET updated_at = now()
     WHERE order_id = $1 AND status = 'payment_pending'`,
    [orderId],
  );
  await client.query(
    `UPDATE orders SET status = 'payment_failed', updated_at = now() WHERE id = $1`,
    [orderId],
  );
}

export async function markOrderRefunded(client: PoolClient, orderId: string, refundedCents: number) {
  await client.query(
    `UPDATE booking_requests SET status = 'refunded', updated_at = now() WHERE order_id = $1`,
    [orderId],
  );
  await client.query(
    `UPDATE payments SET status = 'refunded', refunded_cents = $2, updated_at = now() WHERE order_id = $1`,
    [orderId, refundedCents],
  );
  await client.query(
    `UPDATE order_items SET status = 'refunded' WHERE order_id = $1`,
    [orderId],
  );
  await client.query(
    `UPDATE orders SET status = 'refunded', updated_at = now() WHERE id = $1`,
    [orderId],
  );
}
