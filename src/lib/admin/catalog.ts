import { createAdminClient, hasAdminEnv } from "@/lib/supabase/admin";
import { MARKETS, SERVICE_ZONES, getZonesForMarket } from "@/config/markets";
import { MARKETPLACE_SERVICES } from "@/config/services";

export interface AdminMarket {
  id: string;
  slug: string;
  name: string;
  country: string;
  currency: string;
  timezone: string;
  active: boolean;
  bookingEnabled: boolean;
  launchEnabled: boolean;
  zoneCount: number;
}

export interface AdminServiceZone {
  id: string;
  marketId: string;
  marketName: string;
  name: string;
  active: boolean;
  postalCodes: string[];
  cities: string[];
}

export interface AdminService {
  id: string;
  slug: string;
  name: string;
  category: string;
  pricingModel: string;
  active: boolean;
  supportedMarkets: string[];
  legacyServiceType: string | null;
}

export async function listAdminMarkets(): Promise<AdminMarket[]> {
  if (!hasAdminEnv()) {
    return MARKETS.map((m) => ({
      id: m.id,
      slug: m.slug,
      name: m.name,
      country: m.country,
      currency: m.currency,
      timezone: m.timezone,
      active: m.active,
      bookingEnabled: m.bookingEnabled,
      launchEnabled: m.launchEnabled,
      zoneCount: getZonesForMarket(m.id).length,
    }));
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase.from("markets").select("*").order("name");

  if (error) {
    if (error.message.includes("markets")) {
      return MARKETS.map((m) => ({
        id: m.id,
        slug: m.slug,
        name: m.name,
        country: m.country,
        currency: m.currency,
        timezone: m.timezone,
        active: m.active,
        bookingEnabled: m.bookingEnabled,
        launchEnabled: m.launchEnabled,
        zoneCount: getZonesForMarket(m.id).length,
      }));
    }
    throw new Error(error.message);
  }

  const { data: zones } = await supabase.from("service_zones").select("id, market_id");
  const zoneCounts = new Map<string, number>();
  for (const z of zones ?? []) {
    const marketId = String((z as { market_id: string }).market_id);
    zoneCounts.set(marketId, (zoneCounts.get(marketId) ?? 0) + 1);
  }

  return (data ?? []).map((row) => {
    const r = row as Record<string, unknown>;
    const id = String(r.id);
    const cfg = MARKETS.find((m) => m.id === id);
    return {
      id,
      slug: String(r.slug),
      name: String(r.name),
      country: String(r.country),
      currency: String(r.currency),
      timezone: String(r.timezone),
      active: Boolean(r.active),
      bookingEnabled:
        typeof r.booking_enabled === "boolean"
          ? Boolean(r.booking_enabled)
          : Boolean(cfg?.bookingEnabled),
      launchEnabled:
        typeof r.launch_enabled === "boolean"
          ? Boolean(r.launch_enabled)
          : Boolean(cfg?.launchEnabled),
      zoneCount: zoneCounts.get(id) ?? 0,
    };
  });
}

export async function listAdminServiceZones(marketId?: string): Promise<AdminServiceZone[]> {
  const markets = await listAdminMarkets();
  const marketNameById = new Map(markets.map((m) => [m.id, m.name]));

  if (!hasAdminEnv()) {
    return SERVICE_ZONES.filter((z) => !marketId || z.marketId === marketId).map((z) => ({
      id: z.id,
      marketId: z.marketId,
      marketName: marketNameById.get(z.marketId) ?? z.marketId,
      name: z.name,
      active: z.active,
      postalCodes: z.postalCodes,
      cities: z.cities,
    }));
  }

  const supabase = createAdminClient();
  let query = supabase.from("service_zones").select("*").order("name");
  if (marketId) query = query.eq("market_id", marketId);

  const { data, error } = await query;
  if (error) {
    if (error.message.includes("service_zones")) {
      return SERVICE_ZONES.filter((z) => !marketId || z.marketId === marketId).map((z) => ({
        id: z.id,
        marketId: z.marketId,
        marketName: marketNameById.get(z.marketId) ?? z.marketId,
        name: z.name,
        active: z.active,
        postalCodes: z.postalCodes,
        cities: z.cities,
      }));
    }
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => {
    const r = row as Record<string, unknown>;
    const mid = String(r.market_id);
    return {
      id: String(r.id),
      marketId: mid,
      marketName: marketNameById.get(mid) ?? mid,
      name: String(r.name),
      active: Boolean(r.active),
      postalCodes: Array.isArray(r.postal_codes) ? (r.postal_codes as string[]) : [],
      cities: Array.isArray(r.cities) ? (r.cities as string[]) : [],
    };
  });
}

export async function listAdminServices(): Promise<AdminService[]> {
  if (!hasAdminEnv()) {
    return MARKETPLACE_SERVICES.map((s) => ({
      id: s.id,
      slug: s.slug,
      name: s.name,
      category: s.category,
      pricingModel: s.pricingModel,
      active: s.active,
      supportedMarkets: s.supportedMarkets,
      legacyServiceType: s.legacyServiceType ?? null,
    }));
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase.from("services").select("*").order("name");

  if (error) {
    if (error.message.includes("services")) {
      return MARKETPLACE_SERVICES.map((s) => ({
        id: s.id,
        slug: s.slug,
        name: s.name,
        category: s.category,
        pricingModel: s.pricingModel,
        active: s.active,
        supportedMarkets: s.supportedMarkets,
        legacyServiceType: s.legacyServiceType ?? null,
      }));
    }
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => {
    const r = row as Record<string, unknown>;
    return {
      id: String(r.id),
      slug: String(r.slug ?? r.id),
      name: String(r.name),
      category: String(r.category ?? ""),
      pricingModel: String(r.pricing_model ?? "instant"),
      active: Boolean(r.active ?? true),
      supportedMarkets: Array.isArray(r.supported_markets)
        ? (r.supported_markets as string[])
        : [],
      legacyServiceType: r.legacy_service_type ? String(r.legacy_service_type) : null,
    };
  });
}
