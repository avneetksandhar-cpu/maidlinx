import { NextResponse } from "next/server";
import { isResponse, jsonError, requireSession } from "@/lib/api/http";
import { withUserContext } from "@/lib/db";
import { isOperator } from "@/lib/auth/permissions";
import { writeAudit } from "@/lib/marketplace/audit";
import { canSendMessage, isRequestStatus } from "@/lib/marketplace/request-machine";
import { clientKey, rateLimit } from "@/lib/security/rate-limit";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const limited = rateLimit({ key: clientKey(request, "messages"), limit: 40, windowMs: 60_000 });
  if (!limited.ok) return jsonError("Too many messages.", 429);
  const user = await requireSession();
  if (isResponse(user)) return user;
  let body: { requestId?: string; body?: string };
  try {
    body = (await request.json()) as { requestId?: string; body?: string };
  } catch {
    return jsonError("Invalid request.", 400);
  }
  const text = (body.body ?? "").trim();
  if (!body.requestId || text.length < 1 || text.length > 4000) {
    return jsonError("Message body is required.", 400);
  }
  try {
    const row = await withUserContext(user, async (client) => {
      const requestRow = await client.query<{
        status: string;
        customer_id: string;
        assigned_wingman_id: string | null;
      }>("SELECT status, customer_id, assigned_wingman_id FROM booking_requests WHERE id = $1", [
        body.requestId,
      ]);
      const current = requestRow.rows[0];
      const status = current?.status;
      if (!status || !isRequestStatus(status)) throw new Error("Request not found.");
      let wingmanUserId: string | null = null;
      if (current.assigned_wingman_id) {
        const wingman = await client.query<{ user_id: string | null }>(
          "SELECT user_id FROM wingmen WHERE id = $1",
          [current.assigned_wingman_id],
        );
        wingmanUserId = wingman.rows[0]?.user_id ?? null;
      }
      const access = canSendMessage({
        status,
        userId: user.id,
        customerId: current.customer_id,
        wingmanUserId,
        operator: isOperator(user),
      });
      if (!access.ok) {
        throw new Error(access.reason);
      }
      const inserted = await client.query<{ id: string }>(
        `INSERT INTO messages (request_id, sender_id, body) VALUES ($1, $2, $3) RETURNING id`,
        [body.requestId, user.id, text],
      );
      await writeAudit(client, {
        actorId: user.id,
        entityType: "message",
        entityId: inserted.rows[0].id,
        action: "sent",
      });
      return inserted.rows[0];
    });
    return NextResponse.json({ ok: true, id: row.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not send message.";
    const forbidden = /not a party|opens after/i.test(message);
    return jsonError(message, forbidden ? 403 : 400);
  }
}
