import { BOOKING_EXTRAS, type BookingExtraId } from "@/lib/bookings/constants";
import { emitBookingEvent } from "@/lib/bookings/events";
import { resolveSchedule } from "@/lib/bookings/schedule";
import { estimateTravelMinutes } from "@/lib/eta";
import { resolveMarketOrThrow } from "@/lib/markets/eligibility";
import { estimateServiceDurationMinutes, resolveCatalogService } from "@/lib/services/catalog";
import { createAdminClient } from "@/lib/supabase/admin";
import type { PriceBreakdown } from "@/lib/pricing/calculate";
import type { CreateBookingRequest } from "@/lib/validations/booking-flow";

export interface BookingExtraRow {
  booking_id: string;
  extra_key: string;
  label: string | null;
  quantity: number;
  unit_price_cents: number;
  total_cents: number;
}

export function buildBookingExtraRows(bookingId: string, extras: BookingExtraId[]): BookingExtraRow[] {
  return extras.map((extraKey) => {
    const extra = BOOKING_EXTRAS.find((item) => item.id === extraKey);
    const unitPriceCents = extra?.priceCents ?? 0;
    return {
      booking_id: bookingId,
      extra_key: extraKey,
      label: extra?.label ?? null,
      quantity: 1,
      unit_price_cents: unitPriceCents,
      total_cents: unitPriceCents,
    };
  });
}

export interface StoredBookingCleaner {
  id: string;
  firstName: string | null;
  lastName: string | null;
  ratingAverage: number | null;
  ratingCount: number | null;
  latitude?: number | null;
  longitude?: number | null;
}

export interface StoredBooking {
  id: string;
  status: string;
  customer_id: string | null;
  professional_profile_id: string | null;
  service_type: string;
  scheduled_at: string;
  arrival_window_start: string | null;
  arrival_window_end: string | null;
  bedrooms: number;
  bathrooms: number;
  square_footage: number | null;
  extras: string[];
  subtotal_cents: number;
  platform_fee_cents: number;
  total_cents: number;
  currency: string;
  customer_email: string | null;
  customer_first_name: string | null;
  customer_last_name: string | null;
  customer_phone: string | null;
  address_line1: string | null;
  address_line2: string | null;
  address_city: string | null;
  address_state: string | null;
  address_postal_code: string | null;
  address_country: string | null;
  google_place_id: string | null;
  stripe_payment_intent_id: string | null;
  notes: string | null;
  pricing_snapshot: PriceBreakdown | null;
  market_id: string | null;
  zone_id: string | null;
  quote_requested: boolean;
  estimated_eta_minutes: number | null;
  cleaner: StoredBookingCleaner | null;
  created_at: string;
}

function mapRow(
  row: Record<string, unknown>,
  cleaner: StoredBookingCleaner | null = null,
): StoredBooking {
  return {
    id: String(row.id),
    status: String(row.status),
    customer_id: row.customer_id ? String(row.customer_id) : null,
    professional_profile_id: row.professional_profile_id
      ? String(row.professional_profile_id)
      : null,
    service_type: String(row.service_type),
    scheduled_at: String(row.scheduled_at),
    arrival_window_start: row.arrival_window_start ? String(row.arrival_window_start) : null,
    arrival_window_end: row.arrival_window_end ? String(row.arrival_window_end) : null,
    bedrooms: Number(row.bedrooms),
    bathrooms: Number(row.bathrooms),
    square_footage: row.square_footage ? Number(row.square_footage) : null,
    extras: Array.isArray(row.extras) ? (row.extras as string[]) : [],
    subtotal_cents: Number(row.subtotal_cents),
    platform_fee_cents: Number(row.platform_fee_cents),
    total_cents: Number(row.total_cents),
    currency: String(row.currency),
    customer_email: row.customer_email ? String(row.customer_email) : null,
    customer_first_name: row.customer_first_name ? String(row.customer_first_name) : null,
    customer_last_name: row.customer_last_name ? String(row.customer_last_name) : null,
    customer_phone: row.customer_phone ? String(row.customer_phone) : null,
    address_line1: row.address_line1 ? String(row.address_line1) : null,
    address_line2: row.address_line2 ? String(row.address_line2) : null,
    address_city: row.address_city ? String(row.address_city) : null,
    address_state: row.address_state ? String(row.address_state) : null,
    address_postal_code: row.address_postal_code ? String(row.address_postal_code) : null,
    address_country: row.address_country ? String(row.address_country) : null,
    google_place_id: row.google_place_id ? String(row.google_place_id) : null,
    stripe_payment_intent_id: row.stripe_payment_intent_id
      ? String(row.stripe_payment_intent_id)
      : null,
    notes: row.notes ? String(row.notes) : null,
    pricing_snapshot: row.pricing_snapshot as PriceBreakdown | null,
    market_id: row.market_id ? String(row.market_id) : null,
    zone_id: row.zone_id
      ? String(row.zone_id)
      : row.service_zone_id
        ? String(row.service_zone_id)
        : null,
    quote_requested: Boolean(row.quote_requested),
    estimated_eta_minutes:
      row.estimated_eta_minutes !== undefined && row.estimated_eta_minutes !== null
        ? Number(row.estimated_eta_minutes)
        : null,
    cleaner,
    created_at: String(row.created_at),
  };
}

function withTravelEta(
  row: Record<string, unknown>,
  cleaner: StoredBookingCleaner | null,
): StoredBooking {
  const mapped = mapRow(row, cleaner);
  if (mapped.estimated_eta_minutes != null) return mapped;

  const travel = estimateTravelMinutes({
    originLatitude: cleaner?.latitude,
    originLongitude: cleaner?.longitude,
    destinationLatitude:
      row.address_latitude != null ? Number(row.address_latitude) : null,
    destinationLongitude:
      row.address_longitude != null ? Number(row.address_longitude) : null,
  });

  return { ...mapped, estimated_eta_minutes: travel };
}

async function loadCleanerForBooking(
  professionalProfileId: string | null,
): Promise<StoredBookingCleaner | null> {
  if (!professionalProfileId) return null;

  const supabase = createAdminClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, first_name, last_name")
    .eq("id", professionalProfileId)
    .maybeSingle();

  if (!profile) return null;

  const [{ data: cleaner }, { data: address }] = await Promise.all([
    supabase
      .from("cleaners")
      .select("rating_average, rating_count")
      .eq("user_id", professionalProfileId)
      .maybeSingle(),
    supabase
      .from("addresses")
      .select("latitude, longitude, is_default")
      .or(`profile_id.eq.${professionalProfileId},user_id.eq.${professionalProfileId}`)
      .order("is_default", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const profileRow = profile as Record<string, unknown>;
  const cleanerRow = (cleaner ?? {}) as Record<string, unknown>;
  const addressRow = (address ?? {}) as Record<string, unknown>;

  return {
    id: String(profileRow.id),
    firstName: profileRow.first_name ? String(profileRow.first_name) : null,
    lastName: profileRow.last_name ? String(profileRow.last_name) : null,
    ratingAverage:
      cleanerRow.rating_average !== undefined && cleanerRow.rating_average !== null
        ? Number(cleanerRow.rating_average)
        : null,
    ratingCount:
      cleanerRow.rating_count !== undefined && cleanerRow.rating_count !== null
        ? Number(cleanerRow.rating_count)
        : null,
    latitude: addressRow.latitude != null ? Number(addressRow.latitude) : null,
    longitude: addressRow.longitude != null ? Number(addressRow.longitude) : null,
  };
}

export async function insertBooking(
  input: CreateBookingRequest,
  pricing: PriceBreakdown,
  customerId?: string | null,
): Promise<StoredBooking> {
  const supabase = createAdminClient();

  if (input.idempotencyKey) {
    const { data: existing } = await supabase
      .from("bookings")
      .select("*")
      .eq("idempotency_key", input.idempotencyKey)
      .maybeSingle();
    if (existing) {
      return mapRow(existing as Record<string, unknown>);
    }
  }

  const schedule = resolveSchedule(input.date, input.arrivalWindow);
  // Server-side market resolution only — never trust client marketId/zoneId.
  const marketResolve = resolveMarketOrThrow({
    postalCode: input.postalCode,
    city: input.city,
    state: input.state,
    country: input.country,
  });
  const catalogService = resolveCatalogService(input.serviceType);
  const quoteOnly =
    Boolean(pricing.quoteOnly) || catalogService?.pricingModel === "quote";
  const estimatedDuration =
    pricing.estimatedDurationMinutes ??
    estimateServiceDurationMinutes({
      serviceKey: input.serviceType,
      bedrooms: input.bedrooms,
      bathrooms: input.bathrooms,
      squareFootage: input.squareFootage,
      extrasCount: input.extras.length,
    });
  const currency = marketResolve.market?.currency ?? pricing.currency;
  const propertyType =
    input.propertyType ??
    (typeof input.serviceAnswers?.propertyType === "string"
      ? input.serviceAnswers.propertyType
      : null);
  const answers = {
    bedrooms: input.bedrooms,
    bathrooms: input.bathrooms,
    squareFootage: input.squareFootage,
    notes: input.notes ?? null,
    ...(propertyType ? { propertyType } : {}),
    ...(input.serviceAnswers ?? {}),
  };

  const { data, error } = await supabase
    .from("bookings")
    .insert({
      customer_id: customerId ?? null,
      address_id: null,
      service_type: input.serviceType,
      service_id: catalogService?.id ?? null,
      market_id: marketResolve.market!.id,
      service_zone_id: marketResolve.zone!.id,
      zone_id: marketResolve.zone!.id,
      pricing_model: quoteOnly ? "quote" : (catalogService?.pricingModel ?? "instant"),
      status: quoteOnly ? "confirmed" : "pending_payment",
      payment_status: quoteOnly ? "pending" : "pending",
      quote_requested: quoteOnly,
      scheduled_at: schedule.scheduledAt,
      arrival_window_start: schedule.arrivalWindowStart,
      arrival_window_end: schedule.arrivalWindowEnd,
      estimated_duration_minutes: estimatedDuration,
      notes: input.notes ?? null,
      bedrooms: input.bedrooms,
      bathrooms: input.bathrooms,
      square_footage: input.squareFootage,
      extras: input.extras,
      booking_answers: answers,
      service_answers: answers,
      subtotal_cents: pricing.subtotalCents,
      platform_fee_cents: pricing.platformFeeCents,
      fees_cents: pricing.platformFeeCents,
      tax_cents: 0,
      discount_cents: pricing.discountCents ?? 0,
      total_cents: pricing.totalCents,
      currency,
      coupon_code: pricing.couponCode ?? null,
      quote_id: pricing.quoteId && /^[0-9a-f-]{36}$/i.test(pricing.quoteId) ? pricing.quoteId : null,
      idempotency_key: input.idempotencyKey ?? null,
      customer_email: input.email,
      customer_first_name: input.firstName,
      customer_last_name: input.lastName,
      customer_phone: input.phone,
      address_line1: input.line1,
      address_line2: input.line2 ?? null,
      address_city: input.city,
      address_state: input.state,
      address_postal_code: input.postalCode,
      address_country: input.country,
      address_latitude: input.latitude ?? null,
      address_longitude: input.longitude ?? null,
      google_place_id: input.googlePlaceId ?? null,
      pricing_snapshot: pricing as unknown as import("@/types/database.types").Json,
    })
    .select("*")
    .single();

  if (error || !data) {
    if (error && input.idempotencyKey && /idempotency|duplicate|unique/i.test(error.message)) {
      const { data: existing } = await supabase
        .from("bookings")
        .select("*")
        .eq("idempotency_key", input.idempotencyKey)
        .maybeSingle();
      if (existing) return mapRow(existing as Record<string, unknown>);
    }
    // Columns from 00017 may be absent until migration is applied.
    if (
      error &&
      /coupon_code|quote_id|idempotency_key|schema cache|column/i.test(error.message)
    ) {
      const { data: retry, error: retryError } = await supabase
        .from("bookings")
        .insert({
          customer_id: customerId ?? null,
          address_id: null,
          service_type: input.serviceType,
          service_id: catalogService?.id ?? null,
          market_id: marketResolve.market!.id,
          service_zone_id: marketResolve.zone!.id,
          zone_id: marketResolve.zone!.id,
          pricing_model: quoteOnly ? "quote" : (catalogService?.pricingModel ?? "instant"),
          status: quoteOnly ? "confirmed" : "pending_payment",
          payment_status: quoteOnly ? "pending" : "pending",
          quote_requested: quoteOnly,
          scheduled_at: schedule.scheduledAt,
          arrival_window_start: schedule.arrivalWindowStart,
          arrival_window_end: schedule.arrivalWindowEnd,
          estimated_duration_minutes: estimatedDuration,
          notes: input.notes ?? null,
          bedrooms: input.bedrooms,
          bathrooms: input.bathrooms,
          square_footage: input.squareFootage,
          extras: input.extras,
          booking_answers: answers,
          service_answers: answers,
          subtotal_cents: pricing.subtotalCents,
          platform_fee_cents: pricing.platformFeeCents,
          fees_cents: pricing.platformFeeCents,
          tax_cents: 0,
          discount_cents: pricing.discountCents ?? 0,
          total_cents: pricing.totalCents,
          currency,
          customer_email: input.email,
          customer_first_name: input.firstName,
          customer_last_name: input.lastName,
          customer_phone: input.phone,
          address_line1: input.line1,
          address_line2: input.line2 ?? null,
          address_city: input.city,
          address_state: input.state,
          address_postal_code: input.postalCode,
          address_country: input.country,
          address_latitude: input.latitude ?? null,
          address_longitude: input.longitude ?? null,
          google_place_id: input.googlePlaceId ?? null,
          pricing_snapshot: pricing as unknown as import("@/types/database.types").Json,
        })
        .select("*")
        .single();
      if (retryError || !retry) {
        throw new Error(retryError?.message ?? error.message);
      }
      const retryId = String((retry as Record<string, unknown>).id);
      if (input.extras.length > 0) {
        const extraRows = buildBookingExtraRows(retryId, input.extras as BookingExtraId[]);
        const { error: extrasError } = await supabase.from("booking_extras").insert(extraRows);
        if (extrasError) throw new Error(extrasError.message);
      }
      await emitBookingEvent({
        bookingId: retryId,
        type: "booking_created",
        actor: { id: customerId ?? null, role: customerId ? "customer" : "guest" },
        metadata: {
          serviceType: input.serviceType,
          totalCents: pricing.totalCents,
          currency,
          migrationFallback: true,
        },
      });
      return mapRow(retry as Record<string, unknown>);
    }
    throw new Error(error?.message ?? "Failed to create booking.");
  }

  const bookingId = String((data as Record<string, unknown>).id);
  if (input.extras.length > 0) {
    const extraRows = buildBookingExtraRows(bookingId, input.extras as BookingExtraId[]);
    const { error: extrasError } = await supabase.from("booking_extras").insert(extraRows);
    if (extrasError) {
      throw new Error(extrasError.message);
    }
  }

  await emitBookingEvent({
    bookingId,
    type: "booking_created",
    actor: { id: customerId ?? null, role: customerId ? "customer" : "guest" },
    metadata: {
      serviceType: input.serviceType,
      serviceId: catalogService?.id ?? null,
      marketId: marketResolve.market?.id ?? null,
      zoneId: marketResolve.zone?.id ?? null,
      totalCents: pricing.totalCents,
      currency,
    },
  });

  return mapRow(data as Record<string, unknown>);
}

export async function getBookingById(id: string): Promise<StoredBooking | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from("bookings").select("*").eq("id", id).maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) return null;
  const row = data as Record<string, unknown>;
  const cleaner = await loadCleanerForBooking(
    row.professional_profile_id ? String(row.professional_profile_id) : null,
  );
  return withTravelEta(row, cleaner);
}

export async function attachPaymentIntent(
  bookingId: string,
  paymentIntentId: string,
): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("bookings")
    .update({ stripe_payment_intent_id: paymentIntentId })
    .eq("id", bookingId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function confirmBookingPayment(
  bookingId: string,
  receiptUrl?: string | null,
  chargeId?: string | null,
  paymentIntentId?: string | null,
  amountCents?: number,
  paymentType?: string,
): Promise<StoredBooking | null> {
  const supabase = createAdminClient();

  const booking = await getBookingById(bookingId);
  if (!booking) return null;

  const { data: updated, error: awaitingError } = await supabase
    .from("bookings")
    .update({
      status: "awaiting_assignment",
      payment_status: "deposit_paid",
      ...(receiptUrl ? { stripe_receipt_url: receiptUrl } : {}),
    })
    .eq("id", bookingId)
    .eq("status", "pending_payment")
    .select("id")
    .maybeSingle();

  if (awaitingError) {
    throw new Error(awaitingError.message);
  }

  if (!updated) {
    const current = await getBookingById(bookingId);
    if (current && current.status !== "pending_payment") {
      return current;
    }
    throw new Error("Booking payment could not be confirmed.");
  }

  if (paymentIntentId && amountCents) {
    await upsertPaymentRecord({
      bookingId,
      profileId: null,
      amountCents,
      currency: booking.currency,
      paymentType: paymentType ?? "deposit",
      stripePaymentIntentId: paymentIntentId,
      stripeChargeId: chargeId ?? null,
      stripeReceiptUrl: receiptUrl ?? null,
      status: "succeeded",
    });
  }

  await emitBookingEvent({
    bookingId,
    type: "payment_succeeded",
    actor: { role: "system" },
    metadata: {
      amountCents: amountCents ?? null,
      paymentType: paymentType ?? "deposit",
      hasPaymentIntent: Boolean(paymentIntentId),
    },
  });

  return { ...booking, status: "awaiting_assignment" };
}

export interface UpsertPaymentParams {
  bookingId: string;
  profileId?: string | null;
  amountCents: number;
  currency: string;
  paymentType: string;
  stripePaymentIntentId: string;
  stripeChargeId?: string | null;
  stripeReceiptUrl?: string | null;
  status: "pending" | "processing" | "succeeded" | "failed" | "refunded" | "cancelled";
}

export async function upsertPaymentRecord(params: UpsertPaymentParams): Promise<void> {
  const supabase = createAdminClient();

  const { data: existing } = await supabase
    .from("payments")
    .select("id")
    .eq("stripe_payment_intent_id", params.stripePaymentIntentId)
    .maybeSingle();

  const row = {
    booking_id: params.bookingId,
    profile_id: params.profileId ?? null,
    amount_cents: params.amountCents,
    currency: params.currency,
    status: params.status,
    payment_type: params.paymentType,
    stripe_payment_intent_id: params.stripePaymentIntentId,
    stripe_charge_id: params.stripeChargeId ?? null,
    stripe_receipt_url: params.stripeReceiptUrl ?? null,
  };

  if (existing?.id) {
    const { error } = await supabase.from("payments").update(row).eq("id", existing.id);
    if (error) throw new Error(error.message);
    return;
  }

  const { error } = await supabase.from("payments").insert(row);
  if (error) throw new Error(error.message);
}

export async function findBookingByPaymentIntent(
  paymentIntentId: string,
): Promise<StoredBooking | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .eq("stripe_payment_intent_id", paymentIntentId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data ? mapRow(data as Record<string, unknown>) : null;
}
