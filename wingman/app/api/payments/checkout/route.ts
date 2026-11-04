import { NextResponse } from "next/server";
import { isResponse, jsonError, requireSession } from "@/lib/api/http";
import { withUserContext } from "@/lib/db";
import { writeAudit } from "@/lib/marketplace/audit";
import { assertPaymentAllowed } from "@/lib/marketplace/service";
import type { RequestStatus } from "@/lib/marketplace/constants";
import { isRequestStatus } from "@/lib/marketplace/request-machine";
import { assertCheckoutAllowed, assertServerPrice } from "@/lib/payments/checkout-guard";
import { readStripeEnv } from "@/lib/payments/env";
import { getStripeClient } from "@/services/stripe";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const user = await requireSession();
  if (isResponse(user)) return user;

  let body: { requestId?: string; quoteId?: string; amountCents?: number; returnFlow?: string };
  try {
    body = (await request.json()) as { requestId?: string; quoteId?: string; amountCents?: number };
  } catch {
    return jsonError("Invalid request.", 400);
  }
  if (!body.requestId || !body.quoteId) return jsonError("requestId and quoteId are required.", 400);

  try {
    await assertPaymentAllowed(body.requestId);
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Payment blocked.", 403);
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
    const session = await withUserContext(user, async (client) => {
      const requestRow = await client.query<{
        status: string;
        customer_id: string;
        is_test_fixture: boolean;
      }>("SELECT status, customer_id, is_test_fixture FROM booking_requests WHERE id = $1", [
        body.requestId,
      ]);
      const current = requestRow.rows[0];
      if (!current || !isRequestStatus(current.status)) throw new Error("Request not found.");
      if (current.customer_id !== user.id && user.role !== "admin" && user.role !== "owner") {
        throw new Error("Only the customer can start checkout.");
      }

      const paid = await client.query<{ n: number }>(
        `SELECT count(*)::int AS n FROM payments
         WHERE request_id = $1 AND status IN ('paid', 'refunded')`,
        [body.requestId],
      );
      assertCheckoutAllowed({
        status: current.status as RequestStatus,
        existingPaid: (paid.rows[0]?.n ?? 0) > 0,
      });

      const quote = await client.query<{
        id: string;
        total_cents: number;
        request_id: string;
        terms: string;
      }>("SELECT id, total_cents, request_id, terms FROM quotes WHERE id = $1 AND status = 'accepted'", [
        body.quoteId,
      ]);
      const row = quote.rows[0];
      if (!row || row.request_id !== body.requestId) throw new Error("Accepted quote not found.");
      assertServerPrice({
        quoteTotalCents: row.total_cents,
        clientAmountCents: body.amountCents ?? null,
      });

      const stripe = getStripeClient();
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3005";
      const bookingReturn = body.returnFlow === "booking" && !current.is_test_fixture;
      const successPath = current.is_test_fixture
        ? `/test/booking/${body.requestId}?paid=1`
        : bookingReturn
          ? `/booking/success?requestId=${body.requestId}&paid=1`
          : `/requests/${body.requestId}?paid=1`;
      const cancelPath = current.is_test_fixture
        ? `/test/booking/${body.requestId}?cancelled=1`
        : bookingReturn
          ? `/booking/payment?requestId=${body.requestId}&cancelled=1`
          : `/requests/${body.requestId}?cancelled=1`;
      const existingCustomer = await client.query<{ stripe_customer_id: string | null }>(
        "SELECT stripe_customer_id FROM profiles WHERE id = $1",
        [user.id],
      );
      const stripeCustomerId = existingCustomer.rows[0]?.stripe_customer_id ?? null;
      const checkout = await stripe.checkout.sessions.create({
        mode: "payment",
        success_url: `${appUrl}${successPath}`,
        cancel_url: `${appUrl}${cancelPath}`,
        client_reference_id: body.requestId,
        metadata: { requestId: body.requestId, quoteId: row.id, userId: user.id },
        ...(stripeCustomerId
          ? { customer: stripeCustomerId }
          : { customer_email: user.email, customer_creation: "always" as const }),
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: "usd",
              unit_amount: row.total_cents,
              product_data: {
                name: "Wingman night service",
                description: row.terms.slice(0, 400),
              },
            },
          },
        ],
      });

      await client.query(
        `INSERT INTO payments (quote_id, request_id, stripe_checkout_session_id, amount_cents, status, is_test_fixture)
         VALUES ($1, $2, $3, $4, 'checkout_created', $5)
         ON CONFLICT (stripe_checkout_session_id) DO NOTHING`,
        [row.id, body.requestId, checkout.id, row.total_cents, current.is_test_fixture],
      );
      await client.query(
        `UPDATE booking_requests
         SET status = 'payment_pending', updated_at = now()
         WHERE id = $1 AND status IN ('accepted', 'draft', 'payment_pending')`,
        [body.requestId],
      );
      await writeAudit(client, {
        actorId: user.id,
        entityType: "payment",
        entityId: checkout.id,
        action: "checkout_created",
        toState: "payment_pending",
        payload: { amountCents: row.total_cents, serverPriced: true },
      });
      return checkout;
    });

    return NextResponse.json({ ok: true, url: session.url, id: session.id, configured: true });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Could not start checkout.", 400);
  }
}
