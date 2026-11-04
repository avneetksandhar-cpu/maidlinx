import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api/http";
import { eventShowsBookWithWingman } from "@/lib/marketplace/offers";
import { mapPublicEvent } from "@/lib/marketplace/queries";
import { getPublicEvent, listBookableOffers } from "@/lib/marketplace/service";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  let row;
  try {
    row = await getPublicEvent(id);
  } catch {
    return jsonError("Event is unavailable right now.", 503);
  }
  if (!row) return jsonError("Event not found.", 404);
  if (
    !["discovery_ready", "bookable"].includes(String(row.discovery_status)) ||
    String(row.import_status ?? "approved") !== "approved" ||
    row.merged_into_id ||
    row.stale
  ) {
    return jsonError("Event not found.", 404);
  }
  const bookable = eventShowsBookWithWingman({
    discoveryStatus: String(row.discovery_status),
    hasBookableOffer: Boolean(row.has_bookable_offer),
    bookingStatus: String(row.booking_status ?? "DISCOVERY_ONLY"),
  });
  let offers;
  let marks: Array<Record<string, unknown>>;
  try {
    offers = bookable ? await listBookableOffers(String(row.id)) : [];
    const { getSql } = await import("@/lib/neon");
    marks = (await getSql()`
      SELECT m.mark_type, w.id AS wingman_id, w.display_name, w.photo_url, w.areas, w.specialties
      FROM wingman_event_marks m
      JOIN wingmen w ON w.id = m.wingman_id
      WHERE m.event_id = ${String(row.id)}
        AND w.verification_status = 'verified'
        AND COALESCE(w.is_test_fixture, false) = false
        AND w.suspended_at IS NULL
    `) as Array<Record<string, unknown>>;
  } catch {
    return jsonError("Event is unavailable right now.", 503);
  }
  return NextResponse.json({
    event: mapPublicEvent(row, bookable),
    availableWingmen: marks,
    availableWingmanCount: new Set(marks.map((item) => String(item.wingman_id))).size,
    offers: offers.map((offer) => ({
      id: offer.id,
      serviceType: offer.service_type,
      tablePackageName: offer.table_package_name,
      maxGroupSize: offer.max_group_size,
      minimumSpendCents: offer.minimum_spend_cents,
      serviceFeeCents: offer.service_fee_cents,
      taxesAndFeesCents: offer.taxes_and_fees_cents,
      arrivalWindow: offer.arrival_window,
      dressRequirement: offer.dress_requirement,
      ageRequirement: offer.age_requirement,
      cancellationTerms: offer.cancellation_terms,
      terms: offer.terms,
      expiresAt: offer.expires_at,
      wingman: {
        id: offer.wingman_id,
        displayName: offer.display_name,
        photoUrl: offer.photo_url,
        areas: offer.areas,
        specialties: offer.specialties,
      },
    })),
  });
}
