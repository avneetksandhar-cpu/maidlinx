import { NextResponse } from "next/server";
import { isResponse, jsonError, requireSession } from "@/lib/api/http";
import { getCustomerBooking, toBookingView } from "@/lib/account/queries";
import { loadStripeReceiptHint, persistReceiptHint } from "@/lib/account/stripe-receipt";
import { hasPaidReceipt } from "@/lib/account/history";
import { withUserContext } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const user = await requireSession();
  if (isResponse(user)) return user;
  const { id } = await context.params;

  const row = await withUserContext(user, (client) => getCustomerBooking(client, user, id));
  if (!row) return jsonError("Booking not found.", 404);

  let view = toBookingView(row);
  if (
    hasPaidReceipt({ paymentStatus: row.paymentStatus, amountCents: row.amountCents ?? row.quoteCents }) &&
    (!view.last4 || !view.receiptUrl)
  ) {
    const hint = await loadStripeReceiptHint(row.stripeCheckoutSessionId);
    if (hint.last4 || hint.receiptUrl) {
      await withUserContext(user, (client) =>
        persistReceiptHint(client, {
          checkoutSessionId: row.stripeCheckoutSessionId,
          paymentIntentId: null,
          hint,
          userId: user.id,
        }),
      );
      view = {
        ...view,
        last4: view.last4 ?? hint.last4,
        brand: view.brand ?? hint.brand,
        receiptUrl: view.receiptUrl ?? hint.receiptUrl,
      };
    }
  }

  return NextResponse.json({ booking: view, stripeMode: "test" });
}
