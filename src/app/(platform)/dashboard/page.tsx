import Link from "next/link";
import { Suspense } from "react";
import { GoogleMapsProvider } from "@/components/booking/google-maps-provider";
import {
  CustomerHomeDashboard,
  pickActiveCustomerBooking,
} from "@/components/post-booking/customer-home-dashboard";
import { BusinessHome } from "@/components/dashboard/business-home";
import { getCustomerBookings } from "@/lib/dashboard/bookings";
import { listSavedAddresses } from "@/lib/dashboard/addresses";
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

  const [upcoming, past, properties] = await Promise.all([
    getCustomerBookings(profile.id, email, "upcoming"),
    getCustomerBookings(profile.id, email, "past"),
    listSavedAddresses(profile.id).catch(() => []),
  ]);

  const isBusiness = properties.length >= 2;

  if (isBusiness) {
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const monthMs = monthStart.getTime();

    const completed = past.filter((b) => b.status === "completed");
    const monthly = [...upcoming, ...past].filter((b) => {
      const t = new Date(b.scheduledAt).getTime();
      return Number.isFinite(t) && t >= monthMs && b.status !== "cancelled";
    });
    const monthlySpendCents = monthly.reduce((sum, b) => sum + (b.totalCents || 0), 0);
    const currency = monthly[0]?.currency ?? upcoming[0]?.currency ?? past[0]?.currency ?? "USD";

    return (
      <BusinessHome
        firstName={profile.firstName ?? "there"}
        properties={properties}
        upcoming={upcoming}
        completedCount={completed.length}
        monthlySpendCents={monthlySpendCents}
        currency={currency}
      />
    );
  }

  let activeBooking: StoredBooking | null = null;
  const candidates = upcoming.filter((b) => isPaidBookingStatus(b.status));
  const storedCandidates: StoredBooking[] = [];

  for (const row of candidates.slice(0, 5)) {
    try {
      const full = await getBookingById(row.id);
      if (!full) continue;
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
    <div className="mx-auto max-w-[430px] animate-pulse space-y-6 lg:max-w-none">
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
