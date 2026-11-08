import { notFound } from "next/navigation";
import { BookingsListScreen } from "@/components/customer/bookings/bookings-list-screen";
import { BookingDetailScreen } from "@/components/customer/bookings/booking-detail-screen";
import type { DashboardBooking } from "@/lib/dashboard/bookings";
import type { SavedAddress } from "@/lib/addresses/types";

export const metadata = {
  title: "Bookings UI fixture",
  robots: { index: false, follow: false },
};

/**
 * DEV/preview-only design fixture for Bookings tab screenshots.
 * Never invents live ops truth — clearly labeled sample rows for UI only.
 * Query: ?screen=upcoming|empty|past|details
 */
function sampleSites(): SavedAddress[] {
  return [
    {
      id: "fixture-site-boca",
      label: "Boca office",
      addressLine1: "120 Ocean Blvd",
      city: "Boca Raton",
      region: "FL",
      postalCode: "33432",
      country: "US",
      countryCode: "US",
      latitude: 26.3587,
      longitude: -80.0831,
      isDefault: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];
}

function sampleUpcoming(): DashboardBooking[] {
  const next = new Date();
  next.setDate(next.getDate() + 3);
  next.setHours(9, 0, 0, 0);
  const later = new Date(next);
  later.setDate(later.getDate() + 7);

  return [
    {
      id: "00000000-fixture-bookings-next-0001",
      status: "accepted",
      serviceType: "office",
      scheduledAt: next.toISOString(),
      arrivalWindowStart: new Date(next.getTime()).toISOString(),
      arrivalWindowEnd: new Date(next.getTime() + 2 * 3600_000).toISOString(),
      totalCents: 14500,
      currency: "USD",
      addressLine1: "120 Ocean Blvd",
      addressLine2: null,
      addressCity: "Boca Raton",
      addressState: "FL",
      addressPostalCode: "33432",
      addressCountry: "US",
      addressLatitude: 26.3587,
      addressLongitude: -80.0831,
      addressId: "fixture-site-boca",
      notes: "Front desk check-in · code 4821",
      recurringPreference: "weekly",
      professionalProfileId: "fixture-cleaner",
      professionalName: "Maya Rivera",
      invoiceNumber: null,
      stripeReceiptUrl: null,
      stripePaymentIntentId: "pi_fixture",
      createdAt: new Date().toISOString(),
      cancelledAt: null,
      bedrooms: null,
      bathrooms: null,
      squareFootage: 2200,
      extras: [],
      propertyType: "business",
      preferredCleanerId: null,
    },
    {
      id: "00000000-fixture-bookings-later-0002",
      status: "awaiting_assignment",
      serviceType: "office",
      scheduledAt: later.toISOString(),
      arrivalWindowStart: new Date(later.getTime()).toISOString(),
      arrivalWindowEnd: new Date(later.getTime() + 2 * 3600_000).toISOString(),
      totalCents: 14500,
      currency: "USD",
      addressLine1: "120 Ocean Blvd",
      addressLine2: null,
      addressCity: "Boca Raton",
      addressState: "FL",
      addressPostalCode: "33432",
      addressCountry: "US",
      addressLatitude: 26.3587,
      addressLongitude: -80.0831,
      addressId: "fixture-site-boca",
      notes: null,
      recurringPreference: "weekly",
      professionalProfileId: null,
      professionalName: null,
      invoiceNumber: null,
      stripeReceiptUrl: null,
      stripePaymentIntentId: "pi_fixture_2",
      createdAt: new Date().toISOString(),
      cancelledAt: null,
      bedrooms: null,
      bathrooms: null,
      squareFootage: 2200,
      extras: [],
      propertyType: "business",
      preferredCleanerId: null,
    },
  ];
}

function samplePast(): DashboardBooking[] {
  const past = new Date();
  past.setDate(past.getDate() - 8);
  past.setHours(9, 0, 0, 0);
  return [
    {
      ...sampleUpcoming()[0]!,
      id: "00000000-fixture-bookings-past-0003",
      status: "completed",
      scheduledAt: past.toISOString(),
      arrivalWindowStart: past.toISOString(),
      arrivalWindowEnd: new Date(past.getTime() + 2 * 3600_000).toISOString(),
      stripeReceiptUrl: "https://pay.stripe.com/receipts/test_fixture",
      professionalName: "Maya Rivera",
      professionalProfileId: "fixture-cleaner",
    },
  ];
}

export default async function BookingsUiFixturePage({
  searchParams,
}: {
  searchParams: Promise<{ screen?: string }>;
}) {
  const allow =
    process.env.NODE_ENV !== "production" ||
    process.env.VERCEL_ENV === "preview" ||
    process.env.ALLOW_BOOKING_UI_FIXTURE === "true";
  if (!allow) notFound();

  const { screen: raw } = await searchParams;
  const screen = raw === "empty" || raw === "past" || raw === "details" ? raw : "upcoming";
  const sites = sampleSites();

  return (
    <div className="relative">
      <p className="sticky top-0 z-50 bg-[#01193D] px-3 py-1.5 text-center text-[11px] font-semibold text-[#04CED2]">
        UI fixture only — sample rows · not live bookings · Stripe LIVE OFF
      </p>
      {screen === "empty" ? (
        <BookingsListScreen upcoming={[]} past={[]} sites={sites} initialTab="upcoming" />
      ) : null}
      {screen === "past" ? (
        <BookingsListScreen
          upcoming={sampleUpcoming()}
          past={samplePast()}
          sites={sites}
          initialTab="past"
        />
      ) : null}
      {screen === "details" ? (
        <BookingDetailScreen
          booking={sampleUpcoming()[0]!}
          sites={sites}
          fromTab="upcoming"
        />
      ) : null}
      {screen === "upcoming" ? (
        <BookingsListScreen
          upcoming={sampleUpcoming()}
          past={samplePast()}
          sites={sites}
          initialTab="upcoming"
        />
      ) : null}
    </div>
  );
}
