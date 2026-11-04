import { NextResponse } from "next/server";
import { isResponse, jsonError, requireSession } from "@/lib/api/http";
import { isOperator } from "@/lib/auth/permissions";
import { withUserContext } from "@/lib/db";
import { WINGMAN_EVENT_MARKS, type WingmanEventMark } from "@/lib/marketplace/constants";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const user = await requireSession();
  if (isResponse(user)) return user;
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return jsonError("Invalid request.", 400);
  }
  const mark = String(body.markType ?? "") as WingmanEventMark;
  if (!WINGMAN_EVENT_MARKS.includes(mark)) return jsonError("Unknown mark.", 400);
  const eventId = String(body.eventId ?? "");
  if (!eventId) return jsonError("Event is required.", 400);

  try {
    const saved = await withUserContext(user, async (client) => {
      const wingman = await client.query<{ id: string; verification_status: string; suspended_at: string | null }>(
        isOperator(user) && body.wingmanId
          ? "SELECT id, verification_status, suspended_at FROM wingmen WHERE id = $1"
          : "SELECT id, verification_status, suspended_at FROM wingmen WHERE user_id = $1",
        [isOperator(user) && body.wingmanId ? body.wingmanId : user.id],
      );
      const row = wingman.rows[0];
      if (!row) throw new Error("No Wingman profile is attached to this account.");
      if (row.verification_status !== "verified" || row.suspended_at) {
        throw new Error("Only verified Wingmen can mark events. Unverified accounts stay private.");
      }
      const inserted = await client.query<{ id: string }>(
        `INSERT INTO wingman_event_marks (wingman_id, event_id, mark_type, notes)
         VALUES ($1, $2, $3::wingman_event_mark_type, $4)
         ON CONFLICT (wingman_id, event_id, mark_type) DO UPDATE SET
           notes = EXCLUDED.notes, updated_at = now()
         RETURNING id`,
        [row.id, eventId, mark, body.notes ? String(body.notes) : null],
      );
      return inserted.rows[0];
    });
    return NextResponse.json({ ok: true, mark: saved, publicDirectoryUnchanged: true });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Could not save mark.", 400);
  }
}
