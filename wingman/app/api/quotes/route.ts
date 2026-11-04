import { NextResponse } from "next/server";
import { isOperator } from "@/lib/auth/permissions";
import { isResponse, jsonError, requireSession } from "@/lib/api/http";
import { createQuote } from "@/lib/marketplace/service";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const user = await requireSession();
  if (isResponse(user)) return user;
  if (user.role === "member" && !isOperator(user)) {
    return jsonError("Only a Wingman or operator can issue a quote.", 403);
  }
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return jsonError("Invalid request.", 400);
  }
  try {
    const quote = await createQuote(user, {
      requestId: String(body.requestId ?? ""),
      wingmanId: body.wingmanId ? String(body.wingmanId) : null,
      offerId: body.offerId ? String(body.offerId) : null,
      subtotalCents: Number(body.subtotalCents),
      serviceFeeCents: Number(body.serviceFeeCents),
      taxesCents: body.taxesCents != null ? Number(body.taxesCents) : 0,
      terms: String(body.terms ?? ""),
      revised: Boolean(body.revised),
    });
    return NextResponse.json({ ok: true, quote });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Could not create quote.", 400);
  }
}
