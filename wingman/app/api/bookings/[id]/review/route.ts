import { NextResponse } from "next/server";
import { isResponse, jsonError, requireSession } from "@/lib/api/http";
import { submitReview } from "@/lib/marketplace/test-booking";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const user = await requireSession();
  if (isResponse(user)) return user;
  const { id } = await context.params;
  let body: { rating?: number; body?: string };
  try {
    body = (await request.json()) as { rating?: number; body?: string };
  } catch {
    return jsonError("Invalid request.", 400);
  }
  try {
    const result = await submitReview(user, id, {
      rating: Number(body.rating),
      body: body.body,
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Review failed.", 400);
  }
}
