import { getSession } from "@/lib/auth/session";
import { verifyBookingAccessToken } from "@/lib/bookings/access-token";
import type { StoredBooking } from "@/lib/bookings/repository";

export class BookingAccessError extends Error {
  constructor(message = "You do not have access to this booking.") {
    super(message);
    this.name = "BookingAccessError";
  }
}

export async function assertBookingAccess(
  booking: StoredBooking,
  accessToken?: string | null,
): Promise<void> {
  if (verifyBookingAccessToken(booking.id, accessToken)) {
    return;
  }

  const session = await getSession();
  if (!session) {
    throw new BookingAccessError("Authentication or booking access token required.");
  }

  const role = session.profile?.role ?? "customer";

  if (role === "admin") {
    return;
  }

  const emailMatch =
    booking.customer_email &&
    session.user.email &&
    booking.customer_email.toLowerCase() === session.user.email.toLowerCase();

  const ownerMatch =
    Boolean(booking.customer_id && session.profile?.id && booking.customer_id === session.profile.id);

  if (emailMatch || ownerMatch) {
    return;
  }

  throw new BookingAccessError();
}
