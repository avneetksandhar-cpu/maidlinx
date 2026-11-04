import Link from "next/link";
import { Suspense } from "react";
import { BusinessHome } from "@/components/dashboard/business-home";
import { getCustomerBookings } from "@/lib/dashboard/bookings";
import { listSavedAddresses } from "@/lib/dashboard/addresses";
import { requireCustomerSession } from "@/lib/dashboard/session";
import { routes } from "@/config/site";

export const metadata = {
  title: "Overview",
};

async function DashboardOverview() {
  const { profile, email } = await requireCustomerSession();

  const [upcoming, past, properties] = await Promise.all([
    getCustomerBookings(profile.id, email, "upcoming"),
    getCustomerBookings(profile.id, email, "past"),
    listSavedAddresses(profile.id).catch(() => []),
  ]);

  const completedCount = past.filter((b) => b.status === "completed").length;
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const monthlySpendCents = past
    .filter((b) => {
      const t = new Date(b.scheduledAt).getTime();
      return !Number.isNaN(t) && t >= monthStart && b.totalCents > 0;
    })
    .reduce((sum, b) => sum + b.totalCents, 0);
  const currency = upcoming[0]?.currency ?? past[0]?.currency ?? "USD";

  return (
    <div className="space-y-6">
      <BusinessHome
        firstName={profile.firstName ?? "there"}
        properties={properties}
        upcoming={upcoming}
        completedCount={completedCount}
        monthlySpendCents={monthlySpendCents}
        currency={currency}
      />
      <div className="flex flex-wrap gap-3">
        <Link
          href={routes.dashboardBook}
          className="inline-flex h-12 items-center justify-center rounded-2xl bg-[#04CED2] px-5 text-sm font-semibold text-[#01193D]"
        >
          Book a commercial clean
        </Link>
        <Link
          href={routes.home}
          className="inline-flex h-12 items-center justify-center rounded-2xl border border-white/40 px-5 text-sm font-semibold text-white"
        >
          Home cleaning
        </Link>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="mx-auto max-w-[430px] animate-pulse space-y-6">
      <div className="h-8 w-48 rounded-lg bg-[var(--ml-dark-surface)]" />
      <div className="h-14 rounded-2xl bg-[var(--ml-dark-surface)]" />
      <div className="h-24 rounded-2xl bg-[var(--ml-dark-surface)]" />
      <div className="h-24 rounded-2xl bg-[var(--ml-dark-surface)]" />
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardOverview />
    </Suspense>
  );
}
