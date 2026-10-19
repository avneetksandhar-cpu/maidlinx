/**
 * Market & service-zone configuration.
 * All geo / currency / timezone resolution must go through this module —
 * never hardcode city names in booking or matching logic.
 */

export interface MarketConfig {
  id: string;
  /** Stable uppercase code used in seeds / admin (e.g. TORONTO_GTA). */
  code: string;
  slug: string;
  name: string;
  country: "CA" | "US";
  currency: "CAD" | "USD";
  timezone: string;
  /**
   * Market exists in product geo config (zones / currency / catalog).
   * Does NOT mean customers may book or that ads are open.
   */
  active: boolean;
  /**
   * Customers may create quotes/bookings in this market.
   * Independent per market; default OFF until founder enables after coverage.
   */
  bookingEnabled: boolean;
  /**
   * Market open for customer acquisition / ads.
   * Independent of bookingEnabled (TEST booking can exist without launch).
   */
  launchEnabled: boolean;
  center: { latitude: number; longitude: number };
  /** Provinces / states this market covers (uppercase). */
  regions: string[];
}

export interface ServiceZoneConfig {
  id: string;
  marketId: string;
  name: string;
  active: boolean;
  /** Normalized postal / ZIP prefixes or full codes (uppercase, no spaces). */
  postalCodes: string[];
  /** Optional city names (lowercase) for fallback matching within the market. */
  cities: string[];
}

export const MARKETS: MarketConfig[] = [
  {
    id: "TORONTO_GTA",
    code: "TORONTO_GTA",
    slug: "toronto-gta",
    name: "Toronto / GTA",
    country: "CA",
    currency: "CAD",
    timezone: "America/Toronto",
    // Geo configured; booking/launch stay OFF until coverage + founder enable.
    active: true,
    bookingEnabled: false,
    launchEnabled: false,
    center: { latitude: 43.6532, longitude: -79.3832 },
    regions: ["ON"],
  },
  {
    id: "SOUTH_FLORIDA",
    code: "SOUTH_FLORIDA",
    slug: "south-florida",
    name: "Florida / South Florida",
    country: "US",
    currency: "USD",
    timezone: "America/New_York",
    active: true,
    bookingEnabled: false,
    launchEnabled: false,
    center: { latitude: 26.1224, longitude: -80.1373 },
    regions: ["FL"],
  },
  {
    id: "NEW_YORK",
    code: "NEW_YORK",
    slug: "new-york",
    name: "New York",
    country: "US",
    currency: "USD",
    timezone: "America/New_York",
    // Outside launch set — keep fully dark.
    active: false,
    bookingEnabled: false,
    launchEnabled: false,
    center: { latitude: 40.7128, longitude: -74.006 },
    regions: ["NY"],
  },
  {
    id: "CALIFORNIA",
    code: "CALIFORNIA",
    slug: "california",
    name: "California",
    country: "US",
    currency: "USD",
    timezone: "America/Los_Angeles",
    active: false,
    bookingEnabled: false,
    launchEnabled: false,
    center: { latitude: 34.0522, longitude: -118.2437 },
    regions: ["CA"],
  },
];

/** Launch regions only — never expand customer booking outside this set without Product. */
export const LAUNCH_MARKET_IDS = ["TORONTO_GTA", "SOUTH_FLORIDA"] as const;
export type LaunchMarketId = (typeof LAUNCH_MARKET_IDS)[number];

export function isLaunchMarketId(id: string | null | undefined): id is LaunchMarketId {
  return Boolean(id && (LAUNCH_MARKET_IDS as readonly string[]).includes(id));
}

export const SERVICE_ZONES: ServiceZoneConfig[] = [
  // --- Toronto / Greater Toronto Area (CAD) ---
  {
    id: "zone_toronto_core",
    marketId: "TORONTO_GTA",
    name: "Toronto Core",
    active: true,
    postalCodes: ["M1", "M2", "M3", "M4", "M5", "M6", "M7", "M8", "M9"],
    cities: [
      "toronto",
      "north york",
      "scarborough",
      "etobicoke",
      "york",
      "east york",
      "downtown toronto",
    ],
  },
  {
    id: "zone_gta_west",
    marketId: "TORONTO_GTA",
    name: "GTA West",
    active: true,
    // Peel + Halton FSAs (Mississauga, Brampton, Oakville, Burlington, Milton, Caledon)
    postalCodes: ["L4", "L5", "L6", "L7", "L9"],
    cities: [
      "mississauga",
      "brampton",
      "oakville",
      "burlington",
      "milton",
      "caledon",
      "georgetown",
      "halton hills",
      "acton",
      "bolton",
    ],
  },
  {
    id: "zone_gta_east",
    marketId: "TORONTO_GTA",
    name: "GTA East",
    active: true,
    // Durham + eastern York Region FSAs
    postalCodes: ["L1", "L3"],
    cities: [
      "markham",
      "richmond hill",
      "vaughan",
      "ajax",
      "pickering",
      "whitby",
      "oshawa",
      "brooklin",
      "courtice",
      "bowmanville",
      "uxbridge",
      "stouffville",
      "whitchurch-stouffville",
    ],
  },
  {
    id: "zone_gta_north",
    marketId: "TORONTO_GTA",
    name: "GTA North",
    active: true,
    // Northern York Region / Simcoe fringe commonly booked with GTA
    postalCodes: ["L0G", "L0H", "L0J", "L3X", "L3Y", "L4G"],
    cities: [
      "newmarket",
      "aurora",
      "king city",
      "king",
      "bradford",
      "east gwillimbury",
      "georgina",
      "keswick",
    ],
  },

  // --- Florida / South Florida (USD) ---
  {
    id: "zone_miami_dade",
    marketId: "SOUTH_FLORIDA",
    name: "Miami-Dade",
    active: true,
    postalCodes: ["331", "330", "332"],
    cities: [
      "miami",
      "miami beach",
      "coral gables",
      "hialeah",
      "homestead",
      "doral",
      "kendall",
      "aventura",
      "north miami",
      "cutler bay",
    ],
  },
  {
    id: "zone_broward",
    marketId: "SOUTH_FLORIDA",
    name: "Broward",
    active: true,
    postalCodes: ["333", "334"],
    cities: [
      "fort lauderdale",
      "lauderdale",
      "lauderdale beach",
      "pompano beach",
      "lauderdale park",
      "sunrise",
      "plantation",
      "davie",
      "lauderdale hills",
      "deerfield beach",
      "coral springs",
      "weston",
      "hollywood",
      "hollywood beach",
      "hollywood lakes",
      "hollywood park",
      "hallandale beach",
      "miramar",
      "pembroke pines",
      "tamarac",
      "margate",
    ],
  },
  {
    id: "zone_palm_beach",
    marketId: "SOUTH_FLORIDA",
    name: "Palm Beach",
    active: true,
    postalCodes: ["334"],
    cities: [
      "west palm beach",
      "boca raton",
      "delray beach",
      "boynton beach",
      "jupiter",
      "palm beach gardens",
      "palm beach",
      "lake worth",
      "wellington",
      "royal palm beach",
    ],
  },

  // --- New York (USD) — inactive until launched ---
  {
    id: "zone_nyc_manhattan",
    marketId: "NEW_YORK",
    name: "Manhattan",
    active: false,
    postalCodes: ["100", "101", "102"],
    cities: ["new york", "manhattan", "nyc"],
  },
  {
    id: "zone_nyc_brooklyn",
    marketId: "NEW_YORK",
    name: "Brooklyn",
    active: false,
    postalCodes: ["112"],
    cities: ["brooklyn"],
  },
  {
    id: "zone_nyc_queens",
    marketId: "NEW_YORK",
    name: "Queens",
    active: false,
    postalCodes: ["111", "113", "114", "116"],
    cities: ["queens", "long island city", "astoria", "flushing", "jamaica"],
  },
  {
    id: "zone_nyc_bronx",
    marketId: "NEW_YORK",
    name: "Bronx",
    active: false,
    postalCodes: ["104"],
    cities: ["bronx", "the bronx"],
  },
  {
    id: "zone_nyc_staten_island",
    marketId: "NEW_YORK",
    name: "Staten Island",
    active: false,
    postalCodes: ["103"],
    cities: ["staten island"],
  },
  {
    id: "zone_ny_metro",
    marketId: "NEW_YORK",
    name: "NY Metro",
    active: false,
    // Westchester + western Long Island / NYC-adjacent
    postalCodes: ["105", "106", "107", "108", "109", "110", "115"],
    cities: [
      "yonkers",
      "white plains",
      "new rochelle",
      "mount vernon",
      "hempstead",
      "garden city",
      "great neck",
    ],
  },

  // --- California (USD) — inactive until launched ---
  {
    id: "zone_la",
    marketId: "CALIFORNIA",
    name: "Los Angeles",
    active: false,
    postalCodes: ["900", "901", "902", "903", "904", "905", "906", "907", "908", "910", "911", "912", "913", "914", "915", "916", "917", "918"],
    cities: [
      "los angeles",
      "hollywood hills",
      "santa monica",
      "pasadena",
      "glendale",
      "burbank",
      "long beach",
      "culver city",
      "inglewood",
      "torrance",
      "sherman oaks",
      "van nuys",
      "north hollywood",
    ],
  },
  {
    id: "zone_orange_county",
    marketId: "CALIFORNIA",
    name: "Orange County",
    active: false,
    postalCodes: ["926", "927", "928"],
    cities: [
      "irvine",
      "anaheim",
      "santa ana",
      "newport beach",
      "huntington beach",
      "costa mesa",
      "orange",
      "fullerton",
    ],
  },
  {
    id: "zone_sf_bay",
    marketId: "CALIFORNIA",
    name: "San Francisco Bay Area",
    active: false,
    postalCodes: ["940", "941", "943", "944", "945", "946", "947", "948", "949", "950", "951"],
    cities: [
      "san francisco",
      "oakland",
      "berkeley",
      "san jose",
      "palo alto",
      "mountain view",
      "sunnyvale",
      "fremont",
      "daly city",
      "south san francisco",
    ],
  },
  {
    id: "zone_san_diego",
    marketId: "CALIFORNIA",
    name: "San Diego",
    active: false,
    postalCodes: ["919", "920", "921"],
    cities: ["san diego", "la jolla", "chula vista", "carlsbad", "oceanside"],
  },
];

export function getMarketById(id: string): MarketConfig | undefined {
  return MARKETS.find((m) => m.id === id || m.code === id);
}

export function getMarketBySlug(slug: string): MarketConfig | undefined {
  return MARKETS.find((m) => m.slug === slug);
}

export function getMarketByCode(code: string): MarketConfig | undefined {
  const normalized = code.trim().toUpperCase();
  return MARKETS.find((m) => m.code === normalized || m.id === normalized);
}

export function getActiveMarkets(): MarketConfig[] {
  return MARKETS.filter((m) => m.active);
}

export function getZonesForMarket(marketId: string): ServiceZoneConfig[] {
  return SERVICE_ZONES.filter((z) => z.marketId === marketId && z.active);
}

export function getZoneById(id: string): ServiceZoneConfig | undefined {
  return SERVICE_ZONES.find((z) => z.id === id);
}

export function normalizePostalCode(postal: string | null | undefined): string {
  return (postal ?? "").trim().toUpperCase().replace(/\s+/g, "");
}

export function normalizeCity(city: string | null | undefined): string {
  return (city ?? "").trim().toLowerCase();
}

export function normalizeRegion(region: string | null | undefined): string {
  return (region ?? "").trim().toUpperCase();
}

export interface MarketResolveInput {
  postalCode?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
}

export interface MarketResolveResult {
  market: MarketConfig | null;
  zone: ServiceZoneConfig | null;
  inServiceArea: boolean;
}

function postalMatchesZone(postal: string, zone: ServiceZoneConfig): boolean {
  if (!postal) return false;
  return zone.postalCodes.some(
    (prefix) => postal === prefix || postal.startsWith(prefix),
  );
}

/**
 * Resolve an address to an active market + zone from config.
 * Prefers postal prefix match, then city + region, then country+region fallback.
 */
export function resolveMarket(input: MarketResolveInput): MarketResolveResult {
  const postal = normalizePostalCode(input.postalCode);
  const city = normalizeCity(input.city);
  const region = normalizeRegion(input.state);
  const country = (input.country ?? "").trim().toUpperCase();

  for (const zone of SERVICE_ZONES) {
    if (!zone.active) continue;
    const market = getMarketById(zone.marketId);
    if (!market?.active) continue;

    if (postalMatchesZone(postal, zone)) {
      return { market, zone, inServiceArea: true };
    }
  }

  for (const zone of SERVICE_ZONES) {
    if (!zone.active) continue;
    const market = getMarketById(zone.marketId);
    if (!market?.active) continue;
    if (region && !market.regions.includes(region)) continue;
    if (country && country !== market.country) continue;
    if (city && zone.cities.includes(city)) {
      return { market, zone, inServiceArea: true };
    }
  }

  // Soft market match by country + region (no specific zone).
  if (country || region) {
    const market = MARKETS.find(
      (m) =>
        m.active &&
        (!country || m.country === country) &&
        (!region || m.regions.includes(region)),
    );
    if (market) {
      return { market, zone: null, inServiceArea: false };
    }
  }

  return { market: null, zone: null, inServiceArea: false };
}
