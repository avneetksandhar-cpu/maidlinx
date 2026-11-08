import { notFound } from "next/navigation";
import { Suspense } from "react";
import { BookingDetailScreen } from "@/components/customer/bookings/booking-detail-screen";
import { getScopeForSite } from "@/lib/commercial/scopes";
import { listSavedAddresses } from "@/lib/dashboard/addresses";
import { getBookingForCustomer } from "@/lib/dashboard/bookings";
import { requireCustomerSession } from "@/lib/dashboard/session";
import { routes } from "@/config/site";

export const metadata = {
  title: "Booking details",
  robots: { index: false, follow: false },
};

async function DetailContent({
  bookingId,
  fromTab,
}: {
  bookingId: string;
  fromTab: "upcoming" | "past";
}) {
  const { profile, email } = await requireCustomerSession();
  const booking = await getBookingForCustomer(bookingId, profile.id, email);
  if (!booking) notFound();

  const sites = await listSavedAddresses(profile.id).catch(() => []);
  const match =
    sites.find((s) => s.id === booking.addressId) ??
    sites.find(
      (s) =>
        s.addressLine1.trim().toLowerCase() ===
        (booking.addressLine1 ?? "").trim().toLowerCase(),
    );

  let entryScopeHref: string | null = null;
  if (match) {
    const scope = await getScopeForSite({
      siteAddressId: match.id,
      userId: profile.id,
    }).catch(() => null);
    if (scope?.accessNotes?.trim()) {
      entryScopeHref = routes.dashboardSiteScope(match.id);
    }
  }

  return (
    <BookingDetailScreen
      booking={booking}
      sites={sites}
      fromTab={fromTab}
      entryScopeHref={entryScopeHref}
    />
  );
}

export default async function DashboardBookingDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string }>;
}) {
  const { id } = await params;
  const { from } = await searchParams;
  const fromTab = from === "past" ? "past" : "upcoming";

  return (
    <Suspense
      fallback={
        <div
          className="flex min-h-dvh flex-col bg-white"
          style={{ fontFamily: "var(--ml-font-ios)" }}
        >
          <div className="h-14 bg-[#01193D]" />
          <div className="mx-auto w-full max-w-md animate-pulse space-y-4 px-5 pt-6">
            <div className="h-5 w-28 rounded bg-[#E8ECF0]" />
            <div className="h-9 w-52 rounded-lg bg-[#E8ECF0]" />
            <div className="h-40 rounded-2xl bg-[#F1F4F8]" />
          </div>
        </div>
      }
    >
      <DetailContent bookingId={id} fromTab={fromTab} />
    </Suspense>
  );
}
