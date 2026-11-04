import { NextResponse } from "next/server";
import { isResponse, requireSession } from "@/lib/api/http";
import { hasPaidReceipt } from "@/lib/account/history";
import { listCustomerInvoices, toBookingView } from "@/lib/account/queries";
import { withUserContext } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  const user = await requireSession();
  if (isResponse(user)) return user;

  const rows = await withUserContext(user, (client) => listCustomerInvoices(client, user));
  const invoices = rows
    .filter((row) =>
      hasPaidReceipt({
        paymentStatus: row.paymentStatus,
        amountCents: row.amountCents ?? row.quoteCents,
      }),
    )
    .map((row) => {
      const view = toBookingView(row);
      return {
        id: view.paymentId ?? view.id,
        bookingId: view.id,
        title: view.title,
        amountCents: row.amountCents ?? row.quoteCents,
        currency: "usd",
        paidAt: view.paidAt,
        createdAt: view.createdAt,
        last4: view.last4,
        brand: view.brand,
        receiptUrl: view.receiptUrl,
        testLabel: view.testLabel,
        status: row.paymentStatus,
      };
    });

  return NextResponse.json({
    invoices,
    emptyCopy: "No paid receipts yet",
    stripeMode: "test",
  });
}
