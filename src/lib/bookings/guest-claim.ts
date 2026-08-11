/**
 * Associate guest bookings (customer_id null) with a signed-in customer.
 * Safe: only claims bookings matching the verified session email.
 */

import { createAdminClient, hasAdminEnv } from "@/lib/supabase/admin";
import { emitBookingEvent } from "@/lib/bookings/events";

export async function claimGuestBookingsForUser(input: {
  userId: string;
  email: string;
}): Promise<{ claimed: number; bookingIds: string[] }> {
  if (!hasAdminEnv()) return { claimed: 0, bookingIds: [] };

  const email = input.email.trim().toLowerCase();
  if (!email) return { claimed: 0, bookingIds: [] };

  const supabase = createAdminClient();
  const { data: guests, error } = await supabase
    .from("bookings")
    .select("id")
    .is("customer_id", null)
    .ilike("customer_email", email);

  if (error) throw new Error(error.message);
  if (!guests?.length) return { claimed: 0, bookingIds: [] };

  const ids = guests.map((g) => String((g as { id: string }).id));

  const { data: updated, error: updateError } = await supabase
    .from("bookings")
    .update({ customer_id: input.userId })
    .in("id", ids)
    .is("customer_id", null)
    .select("id");

  if (updateError) throw new Error(updateError.message);

  const claimedIds = (updated ?? []).map((r) => String((r as { id: string }).id));

  for (const bookingId of claimedIds) {
    await supabase.from("guest_booking_claims").upsert(
      {
        booking_id: bookingId,
        claimed_by: input.userId,
        guest_email: email,
      },
      { onConflict: "booking_id" },
    );

    await emitBookingEvent({
      bookingId,
      type: "guest_claimed",
      actor: { id: input.userId, role: "customer" },
      metadata: { email },
    });
  }

  return { claimed: claimedIds.length, bookingIds: claimedIds };
}
