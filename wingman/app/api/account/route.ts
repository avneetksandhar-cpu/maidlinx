import { NextResponse } from "next/server";
import { isResponse, requireSession } from "@/lib/api/http";
import { hasPaidReceipt } from "@/lib/account/history";
import {
  getStripeCustomerId,
  isUpcomingBooking,
  listCustomerBookings,
  listEmergencyContacts,
  toBookingView,
} from "@/lib/account/queries";
import { withUserContext } from "@/lib/db";

export const runtime = "nodejs";

/** Aggregator for the hub. Prefer the split /api/account/* routes. */
export async function GET() {
  const user = await requireSession();
  if (isResponse(user)) return user;

  const payload = await withUserContext(user, async (client) => ({
    rows: await listCustomerBookings(client, user),
    contacts: await listEmergencyContacts(client, user.id),
    stripeCustomerId: await getStripeCustomerId(client, user.id),
  }));

  const bookings = payload.rows.map(toBookingView);
  const upcoming = bookings.find((item) => isUpcomingBooking(item)) ?? null;
  const receipts = bookings.filter((item) =>
    hasPaidReceipt({ paymentStatus: item.paymentStatus, amountCents: item.amountCents }),
  );
  const card = receipts.find((item) => item.last4) ?? null;

  return NextResponse.json({
    profile: {
      displayName: user.displayName,
      email: user.email,
      role: user.role,
    },
    upcoming,
    bookings,
    receipts,
    payment: card
      ? { last4: card.last4, brand: card.brand, source: "stripe_test_checkout" }
      : null,
    stripeCustomerLinked: Boolean(payload.stripeCustomerId),
    emergencyContacts: payload.contacts,
    stripeMode: "test",
    emptyCopy: "No nights yet",
  });
}
