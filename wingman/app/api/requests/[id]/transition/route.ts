import { NextResponse } from "next/server";
import { isOperator } from "@/lib/auth/permissions";
import { isResponse, jsonError, requireSession } from "@/lib/api/http";
import { isRequestStatus } from "@/lib/marketplace/request-machine";
import { transitionRequest } from "@/lib/marketplace/service";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const user = await requireSession();
  if (isResponse(user)) return user;
  const { id } = await context.params;
  let body: { to?: string; wingmanId?: string; notes?: string };
  try {
    body = (await request.json()) as { to?: string; wingmanId?: string; notes?: string };
  } catch {
    return jsonError("Invalid request.", 400);
  }
  if (!body.to || !isRequestStatus(body.to)) {
    return jsonError("Unknown status.", 400);
  }
  if (body.to === "paid") {
    return jsonError("Only a verified Stripe webhook may mark a booking paid.", 403);
  }

  const customerAllowed = ["cancelled"];
  const wingmanAllowed = ["wingman_accepted", "wingman_declined", "revised_terms", "cancelled"];
  if (!isOperator(user)) {
    if (user.role === "partner" && !wingmanAllowed.includes(body.to)) {
      return jsonError("Forbidden transition.", 403);
    }
    if (user.role === "member" && !customerAllowed.includes(body.to)) {
      return jsonError("Forbidden transition.", 403);
    }
  }

  try {
    const status = await transitionRequest(user, id, body.to, {
      wingmanId: body.wingmanId,
      notes: body.notes,
    });
    return NextResponse.json({ ok: true, status });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Transition failed.", 400);
  }
}
