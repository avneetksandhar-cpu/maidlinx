import { NextResponse } from "next/server";
import { isResponse, jsonError, requireSession } from "@/lib/api/http";
import { cancelRequest } from "@/lib/marketplace/test-booking";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const user = await requireSession();
  if (isResponse(user)) return user;
  const { id } = await context.params;
  let notes: string | undefined;
  try {
    const body = (await request.json()) as { notes?: string };
    notes = body.notes;
  } catch {
    notes = undefined;
  }
  try {
    const result = await cancelRequest(user, id, notes);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Cancel failed.", 400);
  }
}
