import { NextResponse } from "next/server";
import { isResponse, jsonError, requireSession } from "@/lib/api/http";
import { withUserContext } from "@/lib/db";
import { writeAudit } from "@/lib/marketplace/audit";

export const runtime = "nodejs";

export async function GET() {
  const user = await requireSession();
  if (isResponse(user)) return user;
  const rows = await withUserContext(user, async (client) => {
    return client.query(
      `SELECT id, request_id, booking_id, subject, notes, created_at
       FROM support_cases
       WHERE opened_by = $1
       ORDER BY created_at DESC`,
      [user.id],
    );
  });
  return NextResponse.json({ cases: rows.rows });
}

export async function POST(request: Request) {
  const user = await requireSession();
  if (isResponse(user)) return user;
  let body: { requestId?: string; bookingId?: string; subject?: string; notes?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return jsonError("Invalid request.", 400);
  }
  const subject = (body.subject ?? "").trim();
  if (!subject) return jsonError("Subject is required.", 400);
  const row = await withUserContext(user, async (client) => {
    const inserted = await client.query<{ id: string }>(
      `INSERT INTO support_cases (request_id, booking_id, opened_by, subject, notes)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [body.requestId ?? null, body.bookingId ?? null, user.id, subject, body.notes ?? null],
    );
    await writeAudit(client, {
      actorId: user.id,
      entityType: "support_case",
      entityId: inserted.rows[0].id,
      action: "opened",
    });
    return inserted.rows[0];
  });
  return NextResponse.json({ ok: true, id: row.id });
}
