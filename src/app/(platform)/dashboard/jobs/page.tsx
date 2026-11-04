import { Suspense } from "react";
import Link from "next/link";
import { BookingCard } from "@/components/dashboard/booking-card";
import { getCustomerBookings } from "@/lib/dashboard/bookings";
import { requireCustomerSession } from "@/lib/dashboard/session";
import { routes } from "@/config/site";

export const metadata = {
  title: "Jobs",
};

async function JobsContent() {
  const { profile, email } = await requireCustomerSession();

  const [upcoming, past] = await Promise.all([
    getCustomerBookings(profile.id, email, "upcoming"),
    getCustomerBookings(profile.id, email, "past"),
  ]);

  return (
    <div className="mx-auto w-full max-w-[430px] space-y-8 lg:max-w-none">
      <header className="space-y-1">
        <h1 className="text-[1.85rem] font-bold tracking-tight text-white">Jobs</h1>
        <p className="text-[15px] text-[var(--ml-dark-ink-muted)]">
          Service orders and visits across your sites. Open a job for crew, window, checklist, and updates.
        </p>
      </header>

      <section>
        <h2 className="mb-3 text-[15px] font-semibold text-white">Upcoming</h2>
        {upcoming.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[var(--ml-dark-border)] bg-[var(--ml-dark-surface)] px-4 py-8 text-center">
            <p className="text-sm font-medium text-white">No upcoming jobs</p>
            <p className="mt-1.5 text-sm text-[var(--ml-dark-ink-muted)]">
              Select a site to book a visit or request quotes.
            </p>
            <Link
              href={routes.dashboardSites}
              className="mt-4 inline-block text-sm font-semibold text-[#04CED2] underline-offset-4 hover:underline"
            >
              Go to Sites
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {upcoming.map((booking) => (
              <div key={booking.id} className="space-y-2">
                <BookingCard booking={booking} />
                <Link
                  href={routes.dashboardJob(booking.id)}
                  className="block text-center text-sm font-semibold text-[#04CED2] underline-offset-4 hover:underline"
                >
                  Service order
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-[15px] font-semibold text-white">Past</h2>
        {past.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-[var(--ml-dark-border)] bg-[var(--ml-dark-surface)] px-4 py-8 text-center text-sm text-[var(--ml-dark-ink-muted)]">
            No past jobs yet.
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

export default function JobsPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-[430px] animate-pulse space-y-4">
          <div className="h-8 w-40 rounded-lg bg-[var(--ml-dark-surface)]" />
          <div className="h-28 rounded-2xl bg-[var(--ml-dark-surface)]" />
        </div>
      }
    >
      <JobsContent />
    </Suspense>
  );
}
