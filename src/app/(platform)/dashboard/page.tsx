import Link from "next/link";
import { Suspense } from "react";
import { BookingCard } from "@/components/dashboard/booking-card";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { BookEmptyState } from "@/components/dashboard/empty-state";
import { Card, CardContent, Heading, Text } from "@/components/ui";
import { routes } from "@/config/site";
import { getCustomerBookings, getInvoices, getReceipts } from "@/lib/dashboard/bookings";
import { requireCustomerSession } from "@/lib/dashboard/session";

export const metadata = {
  title: "Dashboard",
};

async function DashboardOverview() {
  const { profile, email } = await requireCustomerSession();

  const [upcoming, past, invoices, receipts] = await Promise.all([
    getCustomerBookings(profile.id, email, "upcoming"),
    getCustomerBookings(profile.id, email, "past"),
    getInvoices(profile.id, email),
    getReceipts(profile.id, email),
  ]);

  const firstName = profile.firstName ?? "there";

  return (
    <>
      <DashboardHeader
        title={`Welcome back, ${firstName}`}
        description="Manage bookings, invoices, and account preferences in one place."
      />

      <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Upcoming" value={upcoming.length} href={routes.dashboardBookings} />
        <StatCard label="Past bookings" value={past.length} href={routes.dashboardBookings} />
        <StatCard label="Invoices" value={invoices.length} href={routes.dashboardInvoices} />
        <StatCard label="Receipts" value={receipts.length} href={routes.dashboardReceipts} />
      </div>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <Heading as="h2" className="text-xl">
            Upcoming bookings
          </Heading>
          {upcoming.length > 0 && (
            <Link href={routes.dashboardBookings} className="text-sm font-medium text-accent hover:text-accent-hover">
              View all
            </Link>
          )}
        </div>

        {upcoming.length === 0 ? (
          <BookEmptyState />
        ) : (
          <div className="space-y-4">
            {upcoming.slice(0, 3).map((booking) => (
              <BookingCard key={booking.id} booking={booking} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}

function StatCard({ label, value, href }: { label: string; value: number; href: string }) {
  return (
    <Link href={href}>
      <Card className="transition-shadow hover:shadow-elevated">
        <CardContent>
          <Text muted className="text-sm">
            {label}
          </Text>
          <p className="mt-1 font-display text-3xl font-semibold text-ink">{value}</p>
        </CardContent>
      </Card>
    </Link>
  );
}

function DashboardSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-10 w-64 rounded-lg bg-border" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 rounded-xl bg-border" />
        ))}
      </div>
      <div className="h-48 rounded-xl bg-border" />
    </div>
  );
}

export default function DashboardPage() {
  return (
    <div className="px-4 py-8 sm:px-6 lg:px-10">
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardOverview />
      </Suspense>
    </div>
  );
}
