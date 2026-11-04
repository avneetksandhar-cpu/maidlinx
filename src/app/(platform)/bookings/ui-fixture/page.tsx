import { notFound } from "next/navigation";
import { GoogleMapsProvider } from "@/components/booking/google-maps-provider";
import { LiveJobShell } from "@/components/post-booking/live-job-shell";
import { PostBookingDashboard } from "@/components/post-booking/post-booking-dashboard";
import type { StoredBooking } from "@/lib/bookings/repository";

export const metadata = {
  title: "Booking UI fixture",
  robots: { index: false, follow: false },
};

/**
 * DEV-ONLY design fixture for phone screenshots when BOOKABLE=0 / DB inactive.
 * Never linked from product nav. Does not write bookings or invent live ops truth.
 */
function fixtureBooking(state: "pending" | "confirmed"): StoredBooking {
  const base: StoredBooking = {
    id: "00000000-fixture-ui-preview-00000001",
    status: state === "pending" ? "awaiting_assignment" : "accepted",
    customer_id: null,
    professional_profile_id: state === "confirmed" ? "fixture-cleaner" : null,
    service_type: "standard",
    scheduled_at: new Date(Date.now() + 86_400_000).toISOString(),
    arrival_window_start: new Date(Date.now() + 86_400_000 + 8 * 3600_000).toISOString(),
    arrival_window_end: new Date(Date.now() + 86_400_000 + 12 * 3600_000).toISOString(),
    bedrooms: 2,
    bathrooms: 2,
    square_footage: 1500,
    extras: ["inside_oven"],
    subtotal_cents: 18900,
    platform_fee_cents: 2835,
    total_cents: 21735,
    currency: "USD",
    customer_email: null,
    customer_first_name: "Alex",
    customer_last_name: null,
    customer_phone: null,
    address_line1: "100 Biscayne Blvd",
    address_line2: "Apt 12",
    address_city: "Miami",
    address_state: "FL",
    address_postal_code: "33132",
    address_country: "US",
    address_latitude: 25.782,
    address_longitude: -80.19,
    google_place_id: null,
    stripe_payment_intent_id: "pi_fixture_test",
    notes: null,
    pricing_snapshot: null,
    market_id: "south_florida",
    zone_id: null,
    quote_requested: false,
    estimated_eta_minutes: null,
    legal_consent_accepted_at: null,
    legal_consent_policy_version: null,
    cleaner:
      state === "confirmed"
        ? {
            id: "fixture-cleaner",
            firstName: "Jordan",
            lastName: "Lee",
            ratingAverage: 4.9,
            ratingCount: 42,
          }
        : null,
    created_at: new Date().toISOString(),
  };
  return base;
}

export default async function BookingUiFixturePage({
  searchParams,
}: {
  searchParams: Promise<{ state?: string }>;
}) {
  // Local + Vercel Preview only — never on production alias.
  const allow =
    process.env.NODE_ENV !== "production" || process.env.VERCEL_ENV === "preview";
  if (!allow) notFound();

  const { state: raw } = await searchParams;
  const state = raw === "confirmed" ? "confirmed" : "pending";
  const booking = fixtureBooking(state);

  return (
    <LiveJobShell>
      <p className="mb-3 rounded-xl bg-[var(--ml-book-selected,#E6FAFA)] px-3 py-2 text-center text-xs font-semibold text-[var(--ml-book-ink,#01193D)]">
        UI fixture only — not a live booking · Stripe LIVE OFF
      </p>
      <GoogleMapsProvider>
        <PostBookingDashboard
          bookingId={booking.id}
          initialBooking={booking}
          customerFirstName={booking.customer_first_name}
        />
      </GoogleMapsProvider>
    </LiveJobShell>
  );
}
