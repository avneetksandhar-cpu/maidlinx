import Link from "next/link";
import { Suspense } from "react";
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
import { routes } from "@/config/site";

export const metadata = {
  title: "Home",
};

async function DashboardOverview() {
  const { profile, email } = await requireCustomerSession();

  const upcoming = await getCustomerBookings(profile.id, email, "upcoming");

  let activeBooking: StoredBooking | null = null;
  const candidates = upcoming.filter((b) => isPaidBookingStatus(b.status));
  const storedCandidates: StoredBooking[] = [];

  for (const row of candidates.slice(0, 5)) {
    try {
      const full = await getBookingById(row.id);
      if (!full) continue;
      // Only surface bookings this customer owns (repository is id-based; session already scoped list).
      storedCandidates.push(full);
    } catch {
      // Skip rows that cannot be loaded.
    }
  }

  activeBooking = pickActiveCustomerBooking(storedCandidates);

  return (
    <GoogleMapsProvider>
      <CustomerHomeDashboard
        firstName={profile.firstName ?? "there"}
        activeBooking={activeBooking}
        upcoming={upcoming}
      />
    </GoogleMapsProvider>
  );
}

function DashboardSkeleton() {
  return (
    <div className="mx-auto max-w-[430px] animate-pulse space-y-6">
      <div className="h-8 w-40 rounded-lg bg-[var(--maidlinx-border)]" />
      <div className="h-24 rounded-2xl bg-[var(--maidlinx-border)]" />
      <div className="h-64 rounded-2xl bg-[var(--maidlinx-border)]" />
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardOverview />
      <p className="sr-only">
        <Link href={routes.book}>Book a clean</Link>
      </p>
    </Suspense>
  );
}
