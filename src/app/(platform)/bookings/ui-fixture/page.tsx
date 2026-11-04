import { notFound } from "next/navigation";
import { GoogleMapsProvider } from "@/components/booking/google-maps-provider";
import { LiveJobShell } from "@/components/post-booking/live-job-shell";
import { PostBookingDashboard } from "@/components/post-booking/post-booking-dashboard";
import type { StoredBooking } from "@/lib/bookings/repository";

export const metadata = {
  title: "Booking UI fixture",
  robots: { index: false, follow: false },
};

type FixtureState = "requested" | "confirmed" | "on_the_way" | "paid" | "payment_failed";

/**
 * DEV-ONLY design fixture for phone screenshots when BOOKABLE=0 / DB inactive.
 * Never linked from product nav. Does not write bookings or invent live ops truth.
 * Query: ?state=requested|confirmed|on_the_way|paid|payment_failed
 */
function fixtureBooking(state: FixtureState): StoredBooking {
  const cleaner =
    state === "requested"
      ? null
      : {
          id: "fixture-cleaner",
          firstName: "Jordan",
          lastName: "Lee",
          ratingAverage: 4.9,
          ratingCount: 42,
          avatarUrl: null as string | null,
        };

  const statusMap: Record<FixtureState, string> = {
    requested: "awaiting_assignment",
    confirmed: "accepted",
    on_the_way: "on_the_way",
    paid: "completed",
    payment_failed: "completed",
  };

  const paymentMap: Record<FixtureState, string> = {
    requested: "pending",
    confirmed: "pending",
    on_the_way: "pending",
    paid: "paid",
    payment_failed: "failed",
  };

  const base: StoredBooking = {
    id: "00000000-fixture-ui-preview-00000001",
    status: statusMap[state],
    payment_status: paymentMap[state],
    customer_id: null,
    professional_profile_id: cleaner ? "fixture-cleaner" : null,
    service_type: "standard",
    scheduled_at: new Date(Date.now() + 86_400_000).toISOString(),
    arrival_window_start: new Date(Date.now() + 86_400_000 + 12 * 3600_000).toISOString(),
    arrival_window_end: new Date(Date.now() + 86_400_000 + 13 * 3600_000).toISOString(),
    bedrooms: 2,
    bathrooms: 2,
    square_footage: 1500,
    extras: ["inside_oven"],
    subtotal_cents: 17500,
    platform_fee_cents: 0,
    total_cents: 17500,
    currency: "USD",
    customer_email: null,
    customer_first_name: "Alex",
    customer_last_name: null,
    customer_phone: null,
    address_line1: "100 Biscayne Blvd",
    address_line2: "Unit 804 · Front desk check-in",
    address_city: "Miami",
    address_state: "FL",
    address_postal_code: "33132",
    address_country: "US",
    address_latitude: 25.782,
    address_longitude: -80.19,
    google_place_id: null,
    stripe_payment_intent_id: state === "paid" ? "pi_fixture_paid" : null,
    stripe_customer_id: "cus_fixture",
    stripe_setup_intent_id: "seti_fixture",
    stripe_payment_method_id: "pm_fixture",
    stripe_receipt_url: state === "paid" ? "https://pay.stripe.com/receipts/test" : null,
    card_brand: "visa",
    card_last4: "4242",
    notes: null,
    pricing_snapshot: null,
    market_id: "south_florida",
    zone_id: null,
    quote_requested: false,
    estimated_eta_minutes: state === "on_the_way" ? 12 : null,
    legal_consent_accepted_at: null,
    legal_consent_policy_version: null,
    cleaner,
    created_at: new Date().toISOString(),
  };
  return base;
}

function parseState(raw: string | undefined): FixtureState {
  if (raw === "confirmed") return "confirmed";
  if (raw === "on_the_way" || raw === "ontheway") return "on_the_way";
  if (raw === "paid" || raw === "completed") return "paid";
  if (raw === "payment_failed" || raw === "failed") return "payment_failed";
  // legacy aliases
  if (raw === "pending") return "requested";
  return "requested";
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
  const state = parseState(raw);
  const booking = fixtureBooking(state);

  return (
    <LiveJobShell>
      <p className="mb-3 rounded-xl bg-[var(--ml-dark-mint,#04CED2)]/15 px-3 py-2 text-center text-xs font-semibold text-[var(--ml-dark-mint,#04CED2)]">
        UI fixture only — not a live booking · pay-after TEST model · Stripe LIVE OFF
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
