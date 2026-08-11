import { Suspense } from "react";
import { BookingCard } from "@/components/dashboard/booking-card";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { BookEmptyState } from "@/components/dashboard/empty-state";
import { getCustomerBookings } from "@/lib/dashboard/bookings";
import { requireCustomerSession } from "@/lib/dashboard/session";

export const metadata = {
  title: "Bookings",
};

async function BookingsContent() {
  const { profile, email } = await requireCustomerSession();

  const [upcoming, past] = await Promise.all([
    getCustomerBookings(profile.id, email, "upcoming"),
    getCustomerBookings(profile.id, email, "past"),
  ]);

  return (
    <>
      <DashboardHeader
        title="Bookings"
        description="View upcoming cleans and past service history. Cancel or reschedule at least 24 hours ahead."
      />

      <section className="mb-10">
        <h2 className="mb-4 font-display text-xl font-semibold text-ink">Upcoming</h2>
        {upcoming.length === 0 ? (
          <BookEmptyState />
        ) : (
          <div className="space-y-4">
            {upcoming.map((booking) => (
              <BookingCard key={booking.id} booking={booking} />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-4 font-display text-xl font-semibold text-ink">Past</h2>
        {past.length === 0 ? (
          <p className="text-sm text-ink-muted">No past bookings yet.</p>
        ) : (
          <div className="space-y-4">
            {past.map((booking) => (
              <BookingCard key={booking.id} booking={booking} showActions={false} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}

export default function BookingsPage() {
  return (
    <div className="px-4 py-8 sm:px-6 lg:px-10">
      <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-border" />}>
        <BookingsContent />
      </Suspense>
    </div>
  );
}
