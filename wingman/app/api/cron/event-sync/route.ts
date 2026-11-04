import { NextResponse } from "next/server";
import { authorizeEventSync } from "@/lib/events/auth";
import { runDailyEventSync } from "@/lib/events/sync";
import { jsonError } from "@/lib/api/http";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  const auth = await authorizeEventSync(request);
  if (!auth.ok) return jsonError(auth.error, auth.status);
  const result = await runDailyEventSync({ triggeredBy: auth.actor });
  return NextResponse.json({
    ok: true,
    ...result,
    configurationBlocker: result.ticketmasterConfigured
      ? null
      : "TICKETMASTER_API_KEY is missing. Ticketmaster Discovery did not run. This is not a successful Ticketmaster sync.",
    note: result.ticketmasterConfigured
      ? "Partner feed stays disabled. PredictHQ skips without PREDICTHQ_TOKEN."
      : "TICKETMASTER_API_KEY is missing — Ticketmaster adapter skipped. Do not treat this run as a live Ticketmaster sync.",
  });
}

export async function GET(request: Request) {
  return POST(request);
}
