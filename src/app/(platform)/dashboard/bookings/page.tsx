import { Suspense } from "react";
import { BookingCard } from "@/components/dashboard/booking-card";
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
    <div className="mx-auto w-full max-w-[430px] space-y-8 lg:max-w-none">
      <header className="space-y-1">
        <h1 className="text-[1.85rem] font-semibold tracking-tight text-white">Bookings</h1>
        <p className="text-[15px] text-[var(--ml-dark-ink-muted)]">
          Upcoming and past cleans. Cancel or reschedule at least 24 hours ahead — fees follow
          our cancellation policy.
        </p>
      </header>

      <section>
        <h2 className="mb-3 text-[15px] font-semibold text-white">Upcoming</h2>
        {upcoming.length === 0 ? (
          <BookEmptyState />
        ) : (
          <div className="space-y-3">
            {upcoming.map((booking) => (
              <BookingCard key={booking.id} booking={booking} />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-[15px] font-semibold text-white">Past</h2>
        {past.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-[var(--ml-dark-border)] bg-[var(--ml-dark-surface)] px-4 py-8 text-center text-sm text-[var(--ml-dark-ink-muted)]">
            No past bookings yet.
          </p>
        ) : (
          <div className="space-y-3">
            {past.map((booking) => (
              <BookingCard key={booking.id} booking={booking} showActions />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default function BookingsPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-[430px] animate-pulse space-y-4">
          <div className="h-8 w-40 rounded-lg bg-[var(--ml-dark-surface)]" />
          <div className="h-28 rounded-2xl bg-[var(--ml-dark-surface)]" />
        </div>
      }
    >
      <BookingsContent />
    </Suspense>
  );
}
