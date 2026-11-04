import { NextResponse } from "next/server";
import { isResponse, jsonError, requireSession } from "@/lib/api/http";
import { historyLabel } from "@/lib/account/history";
import { getCustomerReceipt } from "@/lib/account/queries";
import { loadStripeReceiptHint, persistReceiptHint } from "@/lib/account/stripe-receipt";
import { withUserContext } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const user = await requireSession();
  if (isResponse(user)) return user;
  const { id } = await context.params;

  const row = await withUserContext(user, (client) => getCustomerReceipt(client, user, id));
  if (!row) return jsonError("No receipt until this night is paid.", 404);

  let last4 = row.last4;
  let brand = row.brand;
  let receiptUrl = row.receiptUrl;
  if (!last4 || !receiptUrl) {
    const hint = await loadStripeReceiptHint(row.stripeCheckoutSessionId);
    last4 = last4 ?? hint.last4;
    brand = brand ?? hint.brand;
    receiptUrl = receiptUrl ?? hint.receiptUrl;
    if (hint.last4 || hint.receiptUrl || hint.customerId) {
      await withUserContext(user, (client) =>
        persistReceiptHint(client, {
          checkoutSessionId: row.stripeCheckoutSessionId,
          paymentIntentId: null,
          hint,
          userId: user.id,
        }),
      );
    }
  }

  const amountCents = row.amountCents ?? row.quoteCents;
  return NextResponse.json({
    id: row.id,
    bookingRef: row.id,
    paymentId: row.paymentId,
    title: row.eventName || row.occasion || "Wingman night service",
    status: row.status,
    amountCents,
    currency: "usd",
    createdAt: row.createdAt,
    startsAt: row.startsAt,
    paidAt: row.paidAt,
    testLabel: historyLabel(row.isTestFixture),
    last4,
    brand,
    receiptUrl,
    stripeMode: "test",
    customer: { displayName: user.displayName, email: user.email },
  });
}
