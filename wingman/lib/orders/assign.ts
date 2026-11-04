import type { PoolClient } from "pg";
import { writeAudit } from "@/lib/marketplace/audit";

export async function assignWingmanAfterPay(
  client: PoolClient,
  args: { requestId: string; wingmanId: string; actorId: string },
) {
  const request = await client.query<{
    status: string;
    assigned_wingman_id: string | null;
    booking_kind: string | null;
  }>(
    `SELECT status, assigned_wingman_id, booking_kind FROM booking_requests WHERE id = $1`,
    [args.requestId],
  );
  const row = request.rows[0];
  if (!row) throw new Error("Booking not found.");
  if (!["paid", "confirmed", "in_progress"].includes(row.status)) {
    throw new Error("Assign a Wingman only after the customer has paid.");
  }

  const wingman = await client.query<{ id: string; display_name: string; suspended_at: string | null }>(
    `SELECT id, display_name, suspended_at FROM wingmen WHERE id = $1`,
    [args.wingmanId],
  );
  if (!wingman.rows[0]) throw new Error("Wingman not found.");
  if (wingman.rows[0].suspended_at) throw new Error("That Wingman is suspended.");

  await client.query(
    `UPDATE booking_requests
     SET assigned_wingman_id = $2, updated_at = now()
     WHERE id = $1`,
    [args.requestId, args.wingmanId],
  );
  await client.query(
    `UPDATE bookings SET wingman_id = $2 WHERE request_id = $1`,
    [args.requestId, args.wingmanId],
  );
  await writeAudit(client, {
    actorId: args.actorId,
    entityType: "booking_request",
    entityId: args.requestId,
    action: "assign_wingman_after_pay",
    fromState: row.assigned_wingman_id,
    toState: args.wingmanId,
    payload: { host: wingman.rows[0].display_name, bookingKind: row.booking_kind },
  });
  return { ok: true as const, hostName: wingman.rows[0].display_name };
}
