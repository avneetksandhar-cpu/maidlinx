import { NextResponse } from "next/server";
import { isResponse, jsonError, requireSession } from "@/lib/api/http";
import { withUserContext } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await requireSession();
  if (isResponse(user)) return user;
  const { id } = await context.params;

  try {
    const data = await withUserContext(user, async (client) => {
      const order = await client.query(
        `SELECT * FROM orders WHERE id = $1 AND (customer_id = $2 OR $3 IN ('admin', 'owner'))`,
        [id, user.id, user.role],
      );
      if (!order.rows[0]) return null;
      const items = await client.query(
        `SELECT i.*, r.status AS request_status, r.assigned_wingman_id, r.drink_option,
                r.starts_at AS booking_starts_at, r.area, r.booking_kind
         FROM order_items i
         LEFT JOIN booking_requests r ON r.id = i.request_id
         WHERE i.order_id = $1
         ORDER BY i.created_at`,
        [id],
      );
      return { order: order.rows[0], items: items.rows };
    });
    if (!data) return jsonError("Order not found.", 404);
    return NextResponse.json(data);
  } catch {
    return jsonError("Order is unavailable right now.", 503);
  }
}
