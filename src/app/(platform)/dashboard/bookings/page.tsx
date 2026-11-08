import { Suspense } from "react";
import { BookingsListScreen } from "@/components/customer/bookings/bookings-list-screen";
import { listSavedAddresses } from "@/lib/dashboard/addresses";
import { getCustomerBookings } from "@/lib/dashboard/bookings";
import { requireCustomerSession } from "@/lib/dashboard/session";

export const metadata = {
  title: "Bookings",
  robots: { index: false, follow: false },
};

async function BookingsContent({
  initialTab,
}: {
  initialTab: "upcoming" | "past";
}) {
  const { profile, email } = await requireCustomerSession();

  let upcoming: Awaited<ReturnType<typeof getCustomerBookings>> = [];
  let past: Awaited<ReturnType<typeof getCustomerBookings>> = [];
  let loadError: string | null = null;

  try {
    [upcoming, past] = await Promise.all([
      getCustomerBookings(profile.id, email, "upcoming"),
      getCustomerBookings(profile.id, email, "past"),
    ]);
  } catch (error) {
    loadError =
      error instanceof Error ? error.message : "Unable to load bookings right now.";
  }

  const sites = await listSavedAddresses(profile.id).catch(() => []);

  return (
    <BookingsListScreen
      upcoming={upcoming}
      past={past}
      sites={sites}
      loadError={loadError}
      initialTab={initialTab}
    />
  );
}

export default async function DashboardBookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  const initialTab = tab === "past" ? "past" : "upcoming";

  return (
    <Suspense
      fallback={
        <div
          className="flex min-h-dvh flex-col bg-white"
          style={{ fontFamily: "var(--ml-font-ios)" }}
        >
          <div className="h-14 bg-[#01193D]" />
          <div className="mx-auto w-full max-w-md animate-pulse space-y-4 px-5 pt-6">
            <div className="h-9 w-40 rounded-lg bg-[#E8ECF0]" />
            <div className="h-11 rounded-full bg-[#F1F4F8]" />
            <div className="h-48 rounded-2xl bg-[#F1F4F8]" />
          </div>
        </div>
      }
    >
      <BookingsContent initialTab={initialTab} />
    </Suspense>
  );
}
