import { createAdminClient, hasAdminEnv } from "@/lib/supabase/admin";
import { listServiceAreas } from "@/lib/admin/service-areas";
import { DEFAULT_MATCH_LIMIT, MATCH_THRESHOLDS } from "@/lib/matching/config";
import { cityStateKey, normalizePostal } from "@/lib/matching/geo";
import { rankCleanersForBooking } from "@/lib/matching/rank";
import { estimateDurationMinutes } from "@/lib/pricing";
import type { BookingServiceId } from "@/lib/bookings/constants";
import type {
  MatchAvailabilitySlot,
  MatchBooking,
  MatchCleaner,
  MatchContext,
  MatchExistingJob,
  ScoredCleaner,
} from "@/lib/matching/types";

export interface AdminMatchSuggestion extends ScoredCleaner {
  ratingAverage: number;
  ratingCount: number;
  isVerified: boolean;
  eligibilitySkipped: false;
}

function parseExtrasKeys(extras: unknown): string[] {
  if (!Array.isArray(extras)) return [];
  return extras
    .map((item) => {
      if (typeof item === "string") return item;
      if (item && typeof item === "object" && "id" in item) {
        return String((item as { id: unknown }).id);
      }
      if (item && typeof item === "object" && "extra_key" in item) {
        return String((item as { extra_key: unknown }).extra_key);
      }
      return null;
    })
    .filter((k): k is string => Boolean(k));
}

function asServiceId(value: string): BookingServiceId {
  const known: BookingServiceId[] = [
    "standard",
    "deep",
    "move_in",
    "move_out",
    "office",
    "airbnb_turnover",
  ];
  return (known.includes(value as BookingServiceId) ? value : "standard") as BookingServiceId;
}

async function loadMatchBooking(bookingId: string): Promise<MatchBooking | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("bookings")
    .select(
      `
      id,
      customer_id,
      service_type,
      service_id,
      market_id,
      zone_id,
      scheduled_at,
      arrival_window_start,
      arrival_window_end,
      notes,
      bedrooms,
      bathrooms,
      square_footage,
      subtotal_cents,
      platform_fee_cents,
      total_cents,
      address_city,
      address_state,
      address_postal_code,
      address_latitude,
      address_longitude,
      extras,
      service_answers
    `,
    )
    .eq("id", bookingId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;

  const row = data as Record<string, unknown>;

  const { data: extraRows } = await supabase
    .from("booking_extras")
    .select("extra_key")
    .eq("booking_id", bookingId);

  const extrasFromTable = (extraRows ?? [])
    .map((r) => String((r as { extra_key: string }).extra_key))
    .filter(Boolean);

  const extrasKeys = extrasFromTable.length > 0 ? extrasFromTable : parseExtrasKeys(row.extras);
  const serviceType = String(row.service_type);
  const durationMinutes = estimateDurationMinutes({
    serviceType: asServiceId(serviceType),
    bedrooms: Number(row.bedrooms ?? 0),
    bathrooms: Number(row.bathrooms ?? 0),
    squareFootage: Number(row.square_footage ?? 1500),
    extrasCount: extrasKeys.length,
  });

  const answers = (row.service_answers ?? {}) as Record<string, unknown>;
  const requiredQualifications = Array.isArray(answers.required_qualifications)
    ? answers.required_qualifications.map(String)
    : undefined;
  const requiresVehicle = Boolean(answers.requires_vehicle);

  return {
    id: String(row.id),
    customerId: row.customer_id ? String(row.customer_id) : null,
    serviceType,
    serviceId: row.service_id ? String(row.service_id) : null,
    marketId: row.market_id ? String(row.market_id) : null,
    zoneId: row.zone_id ? String(row.zone_id) : null,
    scheduledAt: String(row.scheduled_at),
    arrivalWindowStart: row.arrival_window_start ? String(row.arrival_window_start) : null,
    arrivalWindowEnd: row.arrival_window_end ? String(row.arrival_window_end) : null,
    durationMinutes,
    notes: row.notes ? String(row.notes) : null,
    bedrooms: Number(row.bedrooms ?? 0),
    bathrooms: Number(row.bathrooms ?? 0),
    subtotalCents: Number(row.subtotal_cents ?? 0),
    platformFeeCents: Number(row.platform_fee_cents ?? 0),
    totalCents: Number(row.total_cents ?? 0),
    addressCity: row.address_city ? String(row.address_city) : null,
    addressState: row.address_state ? String(row.address_state) : null,
    addressPostalCode: row.address_postal_code ? String(row.address_postal_code) : null,
    addressLatitude: row.address_latitude != null ? Number(row.address_latitude) : null,
    addressLongitude: row.address_longitude != null ? Number(row.address_longitude) : null,
    extrasKeys,
    requiredQualifications,
    requiresVehicle,
  };
}

async function loadMatchCleaners(): Promise<MatchCleaner[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("cleaners")
    .select(
      `
      id,
      user_id,
      is_active,
      is_verified,
      years_experience,
      service_radius_km,
      travel_radius_km,
      rating_average,
      rating_count,
      has_vehicle,
      qualifications,
      profile:profiles!cleaners_user_id_fkey (
        id,
        first_name,
        last_name
      )
    `,
    )
    .eq("is_active", true)
    .limit(200);

  // Fall back to professionals view if cleaner join shape differs.
  let rows: Record<string, unknown>[] = error
    ? []
    : ((data ?? []) as unknown as Record<string, unknown>[]);
  if (error) {
    const fallback = await supabase
      .from("professionals")
      .select(
        `
        id,
        profile_id,
        is_active,
        is_verified,
        years_experience,
        service_radius_km,
        rating_average,
        rating_count,
        profile:profiles!professionals_profile_id_fkey (
          id,
          first_name,
          last_name
        )
      `,
      )
      .eq("is_active", true)
      .limit(200);

    if (fallback.error) throw new Error(fallback.error.message);
    rows = (fallback.data ?? []).map((row) => {
      const record = row as Record<string, unknown>;
      return {
        ...record,
        user_id: record.profile_id,
      };
    });
  }

  const cleanerIds = rows
    .map((row) => String((row as Record<string, unknown>).id))
    .filter(Boolean);
  const profileIds = rows
    .map((row) => {
      const record = row as Record<string, unknown>;
      return record.user_id ? String(record.user_id) : null;
    })
    .filter((id): id is string => Boolean(id));

  const addressByProfile = new Map<
    string,
    { lat: number | null; lng: number | null; city: string | null; state: string | null; postal: string | null }
  >();

  if (profileIds.length > 0) {
    const { data: addresses } = await supabase
      .from("addresses")
      .select("profile_id, user_id, city, state, postal_code, latitude, longitude, is_default")
      .or(`profile_id.in.(${profileIds.join(",")}),user_id.in.(${profileIds.join(",")})`)
      .limit(400);

    for (const addr of addresses ?? []) {
      const record = addr as Record<string, unknown>;
      const key = String(record.profile_id ?? record.user_id ?? "");
      if (!key) continue;
      const existing = addressByProfile.get(key);
      const candidate = {
        lat: record.latitude != null ? Number(record.latitude) : null,
        lng: record.longitude != null ? Number(record.longitude) : null,
        city: record.city ? String(record.city) : null,
        state: record.state ? String(record.state) : null,
        postal: record.postal_code ? String(record.postal_code) : null,
      };
      if (!existing || Boolean(record.is_default)) {
        addressByProfile.set(key, candidate);
      }
    }
  }

  const servicesByCleaner = new Map<string, string[]>();
  const zonesByCleaner = new Map<string, string[]>();

  if (cleanerIds.length > 0) {
    // Marketplace capability tables (Phase 1) — query via untyped client until db:types catches up.
    const db = supabase as unknown as {
      from: (table: string) => {
        select: (cols: string) => {
          in: (
            col: string,
            vals: string[],
          ) => Promise<{ data: unknown[] | null; error: { message: string } | null }>;
        };
      };
    };

    const { data: serviceRows, error: serviceError } = await db
      .from("cleaner_services")
      .select("cleaner_id, service_id")
      .in("cleaner_id", cleanerIds);

    if (!serviceError) {
      for (const row of serviceRows ?? []) {
        const record = row as Record<string, unknown>;
        const id = String(record.cleaner_id);
        const list = servicesByCleaner.get(id) ?? [];
        list.push(String(record.service_id));
        servicesByCleaner.set(id, list);
      }
    }

    const { data: zoneRows, error: zoneError } = await db
      .from("cleaner_service_zones")
      .select("cleaner_id, zone_id")
      .in("cleaner_id", cleanerIds);

    if (!zoneError) {
      for (const row of zoneRows ?? []) {
        const record = row as Record<string, unknown>;
        const id = String(record.cleaner_id);
        const list = zonesByCleaner.get(id) ?? [];
        list.push(String(record.zone_id));
        zonesByCleaner.set(id, list);
      }
    }
  }

  const mapped: MatchCleaner[] = [];
  for (const row of rows) {
    const record = row;
    const profile = record.profile as Record<string, unknown> | null;
    const profileId = profile?.id
      ? String(profile.id)
      : record.user_id
        ? String(record.user_id)
        : null;
    if (!profileId) continue;

    const cleanerId = String(record.id);
    const addr = addressByProfile.get(profileId);
    const radius = Number(record.travel_radius_km ?? record.service_radius_km ?? 25);

    mapped.push({
      profileId,
      cleanerId,
      name:
        [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") || "Unnamed",
      isActive: Boolean(record.is_active),
      isVerified: Boolean(record.is_verified),
      yearsExperience:
        record.years_experience != null ? Number(record.years_experience) : null,
      serviceRadiusKm: radius,
      ratingAverage: Number(record.rating_average ?? 0),
      ratingCount: Number(record.rating_count ?? 0),
      latitude: addr?.lat ?? null,
      longitude: addr?.lng ?? null,
      city: addr?.city ?? null,
      state: addr?.state ?? null,
      postalCode: addr?.postal ?? null,
      offeredServiceTypes: servicesByCleaner.get(cleanerId) ?? [],
      zoneIds: zonesByCleaner.get(cleanerId) ?? [],
      hasVehicle: record.has_vehicle != null ? Boolean(record.has_vehicle) : undefined,
      qualifications: Array.isArray(record.qualifications)
        ? record.qualifications.map(String)
        : [],
    });
  }
  return mapped;
}

async function loadAvailabilityMap(
  profileIds: string[],
): Promise<Map<string, MatchAvailabilitySlot[]>> {
  const map = new Map<string, MatchAvailabilitySlot[]>();
  if (profileIds.length === 0) return map;

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("professional_availability")
    .select("professional_profile_id, day_of_week, arrival_window, is_available")
    .in("professional_profile_id", profileIds);

  if (error) {
    if (error.message.includes("professional_availability")) return map;
    throw new Error(error.message);
  }

  for (const row of data ?? []) {
    const record = row as Record<string, unknown>;
    const profileId = String(record.professional_profile_id);
    const slot: MatchAvailabilitySlot = {
      dayOfWeek: Number(record.day_of_week),
      arrivalWindow: String(record.arrival_window),
      isAvailable: Boolean(record.is_available),
    };
    const list = map.get(profileId) ?? [];
    list.push(slot);
    map.set(profileId, list);
  }

  return map;
}

async function loadJobStats(profileIds: string[]): Promise<{
  completed: Map<string, number>;
  cancelled: Map<string, number>;
}> {
  const completed = new Map<string, number>();
  const cancelled = new Map<string, number>();
  if (profileIds.length === 0) return { completed, cancelled };

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("bookings")
    .select("professional_profile_id, status")
    .in("professional_profile_id", profileIds)
    .in("status", ["completed", "cancelled"]);

  if (error) throw new Error(error.message);

  for (const row of data ?? []) {
    const record = row as Record<string, unknown>;
    const profileId = record.professional_profile_id
      ? String(record.professional_profile_id)
      : null;
    if (!profileId) continue;
    if (record.status === "completed") {
      completed.set(profileId, (completed.get(profileId) ?? 0) + 1);
    } else if (record.status === "cancelled") {
      cancelled.set(profileId, (cancelled.get(profileId) ?? 0) + 1);
    }
  }

  return { completed, cancelled };
}

async function loadExistingJobs(
  profileIds: string[],
  ignoreBookingId: string,
): Promise<Map<string, MatchExistingJob[]>> {
  const map = new Map<string, MatchExistingJob[]>();
  if (profileIds.length === 0) return map;

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("bookings")
    .select(
      "id, professional_profile_id, scheduled_at, bedrooms, bathrooms, square_footage, service_type, extras, address_latitude, address_longitude",
    )
    .in("professional_profile_id", profileIds)
    .in("status", [
      "assigned",
      "accepted",
      "offered",
      "on_the_way",
      "arrived",
      "in_progress",
      "on_the_way",
      "arrived",
      "awaiting_assignment",
    ])
    .neq("id", ignoreBookingId);

  if (error) throw new Error(error.message);

  for (const row of data ?? []) {
    const record = row as Record<string, unknown>;
    const profileId = record.professional_profile_id
      ? String(record.professional_profile_id)
      : null;
    if (!profileId) continue;

    const extrasKeys = parseExtrasKeys(record.extras);
    const durationMinutes = estimateDurationMinutes({
      serviceType: asServiceId(String(record.service_type ?? "standard")),
      bedrooms: Number(record.bedrooms ?? 0),
      bathrooms: Number(record.bathrooms ?? 0),
      squareFootage: Number(record.square_footage ?? 1500),
      extrasCount: extrasKeys.length,
    });

    const list = map.get(profileId) ?? [];
    list.push({
      bookingId: String(record.id),
      scheduledAt: String(record.scheduled_at),
      durationMinutes,
      addressLatitude:
        record.address_latitude != null ? Number(record.address_latitude) : null,
      addressLongitude:
        record.address_longitude != null ? Number(record.address_longitude) : null,
    });
    map.set(profileId, list);
  }

  return map;
}

async function loadRepeatContext(
  customerId: string | null,
  profileIds: string[],
): Promise<{
  favorites: Set<string>;
  repeats: Set<string>;
}> {
  const favorites = new Set<string>();
  const repeats = new Set<string>();
  if (!customerId || profileIds.length === 0) return { favorites, repeats };

  const supabase = createAdminClient();

  const { data: favRows } = await supabase
    .from("customer_favorite_cleaners")
    .select("professional_profile_id")
    .eq("customer_profile_id", customerId);

  for (const row of favRows ?? []) {
    const id = (row as { professional_profile_id: string }).professional_profile_id;
    if (id) favorites.add(String(id));
  }

  const { data: prior } = await supabase
    .from("bookings")
    .select("professional_profile_id")
    .eq("customer_id", customerId)
    .eq("status", "completed")
    .in("professional_profile_id", profileIds);

  for (const row of prior ?? []) {
    const id = (row as { professional_profile_id: string | null }).professional_profile_id;
    if (id) repeats.add(String(id));
  }

  return { favorites, repeats };
}

/**
 * Rank eligible cleaners for an admin booking detail view.
 * Manual assign / offer only — does not mutate booking state.
 */
export async function getRankedMatchesForBooking(
  bookingId: string,
  limit = DEFAULT_MATCH_LIMIT,
): Promise<{ bookingId: string; matches: AdminMatchSuggestion[] }> {
  if (!hasAdminEnv()) {
    return { bookingId, matches: [] };
  }

  const booking = await loadMatchBooking(bookingId);
  if (!booking) {
    throw new Error("Booking not found.");
  }

  const [cleaners, areas] = await Promise.all([loadMatchCleaners(), listServiceAreas()]);
  const profileIds = cleaners.map((c) => c.profileId);

  const [availabilityByProfileId, stats, repeat, existingJobsByProfileId] = await Promise.all([
    loadAvailabilityMap(profileIds),
    loadJobStats(profileIds),
    loadRepeatContext(booking.customerId, profileIds),
    loadExistingJobs(profileIds, bookingId),
  ]);

  const serviceAreaPostalCodes = new Set<string>();
  const serviceAreaCityStates = new Set<string>();
  for (const area of areas) {
    if (!area.isActive) continue;
    for (const postal of area.postalCodes) {
      const normalized = normalizePostal(postal);
      if (normalized) serviceAreaPostalCodes.add(normalized);
    }
    const key = cityStateKey(area.city, area.state);
    if (key !== "|") serviceAreaCityStates.add(key);
  }

  const context: MatchContext = {
    serviceAreaPostalCodes,
    serviceAreaCityStates,
    availabilityByProfileId,
    completedJobsByProfileId: stats.completed,
    cancelledJobsByProfileId: stats.cancelled,
    favoriteProfileIds: repeat.favorites,
    repeatProfileIds: repeat.repeats,
    existingJobsByProfileId,
    travelBufferMinutes: MATCH_THRESHOLDS.travelBufferMinutes,
  };

  const ranked = rankCleanersForBooking(booking, cleaners, context, { limit });
  const byProfile = new Map(cleaners.map((c) => [c.profileId, c]));

  const matches: AdminMatchSuggestion[] = ranked.map((item) => {
    const source = byProfile.get(item.profileId);
    return {
      ...item,
      ratingAverage: source?.ratingAverage ?? 0,
      ratingCount: source?.ratingCount ?? 0,
      isVerified: source?.isVerified ?? false,
      eligibilitySkipped: false,
    };
  });

  return { bookingId, matches };
}
