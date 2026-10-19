import { NextResponse } from "next/server";
import { isResponse, jsonError, requireOperator } from "@/lib/api/http";
import { runDailyEventSync } from "@/lib/events/sync";
import type { SourceSlug } from "@/lib/events/types";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  const user = await requireOperator();
  if (isResponse(user)) return user;
  let only: SourceSlug[] | undefined;
  try {
    const body = (await request.json()) as { source?: string };
    if (body.source) only = [body.source as SourceSlug];
  } catch {
    only = undefined;
  }
  try {
    const result = await runDailyEventSync({ triggeredBy: `admin:${user.id}`, only });
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Sync failed.", 400);
  }
}
