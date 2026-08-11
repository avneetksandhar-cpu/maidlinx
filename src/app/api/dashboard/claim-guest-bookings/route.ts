import { jsonError, jsonSuccess } from "@/lib/api/response";
import { claimGuestBookingsForUser } from "@/lib/bookings/guest-claim";
import { requireCustomerSession } from "@/lib/dashboard/session";

/** Associate prior guest checkouts (matching verified email) with the signed-in customer. */
export async function POST() {
  try {
    const { profile, email } = await requireCustomerSession();
    const result = await claimGuestBookingsForUser({
      userId: profile.id,
      email,
    });
    return jsonSuccess(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to claim guest bookings.";
    const status = message.includes("Authentication") ? 401 : 500;
    return jsonError(message, status);
  }
}
