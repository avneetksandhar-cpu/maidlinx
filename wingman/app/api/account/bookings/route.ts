import { NextResponse } from "next/server";
import { isResponse, requireSession } from "@/lib/api/http";
import { isUpcomingBooking, listCustomerBookings, toBookingView } from "@/lib/account/queries";
import { withUserContext } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  const user = await requireSession();
  if (isResponse(user)) return user;

  const rows = await withUserContext(user, (client) => listCustomerBookings(client, user));
  const bookings = rows.map(toBookingView);
  const upcoming = bookings.filter((item) => isUpcomingBooking(item));
  const past = bookings.filter((item) => !isUpcomingBooking(item));

  return NextResponse.json({
    upcoming,
    past,
    bookings,
    emptyCopy: "No nights yet",
    stripeMode: "test",
  });
}
