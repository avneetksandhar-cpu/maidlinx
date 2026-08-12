import { getActiveServices } from "@/config/services";
import {
  LAUNCH_MARKET_IDS,
  SERVICE_ZONES,
  getZoneById,
  isLaunchMarketId,
} from "@/config/markets";
import { createAdminClient } from "@/lib/supabase/admin";

export interface CleanerCapabilities {
  cleanerId: string;
  marketId: string | null;
  serviceIds: string[];
  zoneIds: string[];
  hasVehicle: boolean;
  qualifications: string[];
  travelRadiusKm: number | null;
  stripeConnectId: string | null;
  payoutStatus: "not_connected" | "pending" | "ready";
}

/** Supabase client without generated types for marketplace capability tables. */
function marketplaceTables() {
  return createAdminClient() as unknown as {
    from: (table: string) => ReturnType<ReturnType<typeof createAdminClient>["from"]>;
  };
}

export async function getCleanerIdForProfile(profileId: string): Promise<string | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("cleaners")
    .select("id")
    .eq("user_id", profileId)
    .maybeSingle();

  if (!error && data?.id) return String(data.id);

  const { data: byProfile } = await supabase
    .from("professionals")
    .select("id")
    .eq("profile_id", profileId)
    .maybeSingle();

  return byProfile?.id ? String(byProfile.id) : null;
}

export async function getCleanerCapabilities(profileId: string): Promise<CleanerCapabilities | null> {
  const cleanerId = await getCleanerIdForProfile(profileId);
  if (!cleanerId) return null;

  const supabase = createAdminClient();
  const db = marketplaceTables();

  const { data: cleaner } = await supabase.from("cleaners").select("*").eq("id", cleanerId).maybeSingle();

  let serviceIds: string[] = [];
  let zoneIds: string[] = [];

  try {
    const { data: services, error } = await db
      .from("cleaner_services")
      .select("service_id")
      .eq("cleaner_id", cleanerId);
    if (!error && services) {
      serviceIds = (services as { service_id: string }[]).map((row) => String(row.service_id));
    }
  } catch {
    serviceIds = [];
  }

  try {
    const { data: zones, error } = await db
      .from("cleaner_service_zones")
      .select("zone_id")
      .eq("cleaner_id", cleanerId);
    if (!error && zones) {
      zoneIds = (zones as { zone_id: string }[]).map((row) => String(row.zone_id));
    }
  } catch {
    zoneIds = [];
  }

  const record = (cleaner ?? {}) as Record<string, unknown>;
  const stripeConnectId = record.stripe_connect_id ? String(record.stripe_connect_id) : null;

  return {
    cleanerId,
    marketId: record.market_id ? String(record.market_id) : null,
    serviceIds,
    zoneIds,
    hasVehicle: Boolean(record.has_vehicle),
    qualifications: Array.isArray(record.qualifications)
      ? (record.qualifications as string[])
      : [],
    travelRadiusKm: record.travel_radius_km != null ? Number(record.travel_radius_km) : null,
    stripeConnectId,
    payoutStatus: stripeConnectId ? "ready" : "not_connected",
  };
}

export async function updateCleanerCapabilities(
  profileId: string,
  input: {
    serviceIds: string[];
    zoneIds: string[];
    marketId?: string | null;
    hasVehicle?: boolean;
    travelRadiusKm?: number | null;
  },
): Promise<CleanerCapabilities> {
  const cleanerId = await getCleanerIdForProfile(profileId);
  if (!cleanerId) throw new Error("Cleaner profile not found.");

  const validServiceIds = new Set(getActiveServices().map((s) => s.id));
  const validZoneIds = new Set(
    SERVICE_ZONES.filter(
      (z) => z.active && (LAUNCH_MARKET_IDS as readonly string[]).includes(z.marketId),
    ).map((z) => z.id),
  );

  const serviceIds = [...new Set(input.serviceIds)].filter((id) => validServiceIds.has(id));
  const zoneIds = [...new Set(input.zoneIds)].filter((id) => validZoneIds.has(id));

  const supabase = createAdminClient();
  const { data: existingCleaner } = await supabase
    .from("cleaners")
    .select("market_id")
    .eq("id", cleanerId)
    .maybeSingle();
  const existingMarketId = existingCleaner?.market_id
    ? String(existingCleaner.market_id)
    : null;

  let marketId: string | null =
    input.marketId !== undefined ? input.marketId : existingMarketId;
  if (marketId && !isLaunchMarketId(marketId)) {
    throw new Error("Market must be TORONTO_GTA or SOUTH_FLORIDA.");
  }
  if (!marketId && zoneIds.length > 0) {
    const derived = new Set(
      zoneIds.map((id) => getZoneById(id)?.marketId).filter(Boolean) as string[],
    );
    if (derived.size > 1) {
      throw new Error("Service zones must belong to a single market.");
    }
    marketId = Array.from(derived)[0] ?? null;
  }
  if (marketId && zoneIds.length > 0) {
    const mismatched = zoneIds.some((id) => getZoneById(id)?.marketId !== marketId);
    if (mismatched) {
      throw new Error("Selected zones must match the cleaner market.");
    }
  }

  const db = marketplaceTables();

  await db.from("cleaner_services").delete().eq("cleaner_id", cleanerId);
  await db.from("cleaner_service_zones").delete().eq("cleaner_id", cleanerId);

  if (serviceIds.length > 0) {
    const { error } = await db
      .from("cleaner_services")
      .insert(serviceIds.map((service_id) => ({ cleaner_id: cleanerId, service_id })));
    if (error) throw new Error(error.message);
  }

  if (zoneIds.length > 0) {
    const { error } = await db
      .from("cleaner_service_zones")
      .insert(zoneIds.map((zone_id) => ({ cleaner_id: cleanerId, zone_id })));
    if (error) throw new Error(error.message);
  }

  await supabase
    .from("cleaners")
    .update({
      has_vehicle: input.hasVehicle ?? false,
      travel_radius_km: input.travelRadiusKm ?? null,
      market_id: marketId,
    } as never)
    .eq("id", cleanerId);

  if (input.travelRadiusKm != null) {
    await supabase
      .from("professionals")
      .update({ service_radius_km: input.travelRadiusKm })
      .eq("id", cleanerId);
  }

  const updated = await getCleanerCapabilities(profileId);
  if (!updated) throw new Error("Unable to load updated capabilities.");
  return updated;
}

export function catalogServicesForUi() {
  return getActiveServices().map((s) => ({
    id: s.id,
    name: s.name,
    legacyServiceType: s.legacyServiceType,
    category: s.category,
  }));
}

export function catalogZonesForUi() {
  return SERVICE_ZONES.filter(
    (z) => z.active && (LAUNCH_MARKET_IDS as readonly string[]).includes(z.marketId),
  ).map((z) => ({
    id: z.id,
    name: z.name,
    marketId: z.marketId,
  }));
}
