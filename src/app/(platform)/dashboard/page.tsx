import Link from "next/link";
import { Suspense } from "react";
import { CustomerPropertiesHome } from "@/components/customer/customer-properties-home";
import { getCustomerBookings } from "@/lib/dashboard/bookings";
import { listSavedAddresses } from "@/lib/dashboard/addresses";
import { requireCustomerSession } from "@/lib/dashboard/session";
import { routes } from "@/config/site";

export const metadata = {
  title: "Home",
};

async function DashboardOverview() {
  const { profile, email } = await requireCustomerSession();

  const [upcoming, properties] = await Promise.all([
    getCustomerBookings(profile.id, email, "upcoming"),
    listSavedAddresses(profile.id).catch(() => []),
  ]);

  return (
    <CustomerPropertiesHome
      firstName={profile.firstName ?? "there"}
      properties={properties}
      upcoming={upcoming}
    />
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
      <p className="sr-only">
        <Link href={routes.book}>Schedule a clean</Link>
      </p>
    </Suspense>
  );
}
