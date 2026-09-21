import { NextResponse } from "next/server";
import { isResponse, jsonError, requireSession } from "@/lib/api/http";
import { acceptQuote } from "@/lib/marketplace/service";

export const runtime = "nodejs";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const user = await requireSession();
  if (isResponse(user)) return user;
  const { id } = await context.params;
  try {
    const result = await acceptQuote(user, id);
    return NextResponse.json({ ok: true, ...result, paymentAvailable: true });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Could not accept quote.", 400);
  }
}
