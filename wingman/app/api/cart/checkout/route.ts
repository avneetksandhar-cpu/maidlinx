import { NextResponse } from "next/server";
import { isResponse, jsonError, requireSession } from "@/lib/api/http";
import type { CartItemInput } from "@/lib/catalog/types";
import { checkoutCart } from "@/lib/orders/checkout";
import { readStripeEnv } from "@/lib/payments/env";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const user = await requireSession();
  if (isResponse(user)) return user;

  let body: { items?: CartItemInput[] };
  try {
    body = (await request.json()) as { items?: CartItemInput[] };
  } catch {
    return jsonError("Invalid request.", 400);
  }
  if (!Array.isArray(body.items) || body.items.length === 0) {
    return jsonError("Add something to your cart first.", 400);
  }

  const env = readStripeEnv();
  if (!env.ok) {
    return NextResponse.json(
      {
        error: "Payment is not available right now.",
        configured: false,
        blocker: "Payment is not available right now. Try again later.",
      },
      { status: 503 },
    );
  }

  try {
    const session = await checkoutCart(user, body.items);
    return NextResponse.json({
      ok: true,
      url: session.url,
      id: session.id,
      orderId: session.orderId,
      configured: true,
    });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Could not start checkout.", 400);
  }
}
