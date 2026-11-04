import { NextResponse } from "next/server";
import { isResponse, jsonError, requireSession } from "@/lib/api/http";
import { pickBackupListing } from "@/lib/marketplace/backup";
import {
  ASSIGNED_HOST_NAME,
  MORE_WINGMEN_NOTE,
  YOUR_WINGMAN_DISPLAY_NAME,
} from "@/lib/marketplace/host-copy";
import { NIGHT_SERVICE_SOURCE, backupFromNightPlan } from "@/lib/marketplace/night-service";
import { withUserContext } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const user = await requireSession();
  if (isResponse(user)) return user;
  const { id } = await context.params;

  try {
    const payload = await withUserContext(user, async (client) => {
      const request = await client.query(
        `SELECT r.*, e.name AS event_name, e.external_id AS event_external_id,
                e.official_source_url, e.discovery_status, e.venue_id
         FROM booking_requests r
         LEFT JOIN events e ON e.id = r.event_id
         WHERE r.id = $1`,
        [id],
      );
      if (!request.rows[0]) return null;
      const quotes = await client.query(
        "SELECT * FROM quotes WHERE request_id = $1 ORDER BY created_at DESC",
        [id],
      );
      const booking = await client.query("SELECT * FROM bookings WHERE request_id = $1", [id]);
      const messages = await client.query(
        "SELECT id, sender_id, body, created_at FROM messages WHERE request_id = $1 ORDER BY created_at ASC",
        [id],
      );
      return {
        request: request.rows[0],
        quotes: quotes.rows,
        booking: booking.rows[0] ?? null,
        messages: messages.rows,
      };
    });
    if (!payload) return jsonError("Request not found.", 404);
    const nightService = String(payload.request.source) === NIGHT_SERVICE_SOURCE;
    const storedBackup = backupFromNightPlan(payload.request.night_plan);
    const backup =
      storedBackup ??
      (await pickBackupListing({
        id: payload.request.event_id ? String(payload.request.event_id) : null,
        externalId: payload.request.event_external_id
          ? String(payload.request.event_external_id)
          : null,
      }));
    return NextResponse.json({
      ...payload,
      nightService,
      backup,
      host: {
        hostName: ASSIGNED_HOST_NAME,
        displayName: YOUR_WINGMAN_DISPLAY_NAME,
        unpublished: true,
        publicVerified: false,
        governmentIdVerified: false,
        photoUrl: null,
        reviews: [],
        note: MORE_WINGMEN_NOTE,
      },
    });
  } catch {
    return jsonError("Request not found.", 404);
  }
}
