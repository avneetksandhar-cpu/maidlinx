import { CustomerShell } from "@/components/customer/customer-shell";
import { GoogleMapsProvider } from "@/components/booking/google-maps-provider";
import {
  CustomerHomeDashboard,
  pickActiveCustomerBooking,
} from "@/components/post-booking/customer-home-dashboard";
import { getCustomerBookings } from "@/lib/dashboard/bookings";
import { requireCustomerSession } from "@/lib/dashboard/session";
import { getBookingById } from "@/lib/bookings/repository";
import { isPaidBookingStatus } from "@/lib/bookings/status";
import type { StoredBooking } from "@/lib/bookings/repository";

export const metadata = {
  title: "Account",
};

/**
 * Customer account home — same visual system as post-booking dashboard.
 */
export default async function AccountPage() {
  const { profile, email } = await requireCustomerSession();
  const upcoming = await getCustomerBookings(profile.id, email, "upcoming");

  const storedCandidates: StoredBooking[] = [];
  for (const row of upcoming.filter((b) => isPaidBookingStatus(b.status)).slice(0, 5)) {
    try {
      const full = await getBookingById(row.id);
      if (full) storedCandidates.push(full);
    } catch {
      // skip unloadable rows
    }
  }

  const activeBooking = pickActiveCustomerBooking(storedCandidates);

  return (
    <CustomerShell>
      <GoogleMapsProvider>
        <CustomerHomeDashboard
          firstName={profile.firstName ?? "there"}
          activeBooking={activeBooking}
          upcoming={upcoming}
        />
      </GoogleMapsProvider>
    </CustomerShell>
  );
}
