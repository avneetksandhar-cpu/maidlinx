/**
 * Launch cleaner coverage readiness — pure rules + DB snapshot builder.
 * Markets are independent: TORONTO_GTA and SOUTH_FLORIDA never share readiness.
 * Honest zeros; never invents capacity or cleaner markets.
 */

import { LAUNCH_MARKET_IDS, MARKETS, getZonesForMarket } from "@/config/markets";
import { canReceiveJobOffers } from "@/lib/cleaners/onboarding";
import { loadMarketFlagSnapshots } from "@/lib/markets/flags";
import { marketPricingReady } from "@/lib/pricing/market-prices";
import { createAdminClient, hasAdminEnv } from "@/lib/supabase/admin";

export type LaunchCoverageStatus = "GREEN" | "YELLOW" | "RED";

export interface CleanerCoverageRow {
  cleanerId: string;
  approved: boolean;
  active: boolean;
  onboardingStatus: string;
  isOnline: boolean;
  marketId: string | null;
  markets: string[];
  zoneCount: number;
  serviceCount: number;
  availabilityCount: number;
  eligibleToReceiveJobs: boolean;
  bookable: boolean;
  upcomingAssignments: number;
  missing: string[];
}

export interface MarketLaunchCoverage {
  marketId: string;
  marketName: string;
  configuredActive: boolean;
  bookingEnabled: boolean;
  launchEnabled: boolean;
  approvedCleaners: number;
  bookableCleaners: number;
  availableToday: number;
  availableCapacity: number;
  servicesCovered: number;
  catalogServices: number;
  zonesConfigured: number;
  zonesWithCleaners: number;
  geographicCoverage: string;
  majorGaps: string[];
  pricingReady: boolean;
  currencyReady: boolean;
  currency: "CAD" | "USD" | null;
  /** Coverage only — never GREEN for a single bookable cleaner. */
  coverageReady: boolean;
  /** launch_enabled + booking_enabled + coverageReady */
  launchReady: boolean;
  status: LaunchCoverageStatus;
}

export interface LaunchCoverageSnapshot {
  generatedAt: string;
  available: boolean;
  /** Do not use for per-market launch decisions — markets are independent. */
  overallStatus: LaunchCoverageStatus;
  cleanerCoverageReady: boolean;
  recommendedFirstMarket: string | null;
  candidateFirstMarket: string | null;
  totals: {
    totalCleaners: number;
    approvedCleaners: number;
    bookableCleaners: number;
    cleanersWithAvailability: number;
    eligibleOnline: number;
    unassignedApprovedCleaners: number;
  };
  cleaners: CleanerCoverageRow[];
  markets: MarketLaunchCoverage[];
  gaps: string[];
}

/** Minimum bookable cleaners before a market can be coverage GREEN (redundancy). */
export const COVERAGE_REDUNDANCY_MIN_BOOKABLE = 2;

export function evaluateCleanerCoverage(input: {
  cleanerId: string;
  approved: boolean;
  active: boolean;
  onboardingStatus: string;
  isOnline: boolean;
  marketId: string | null;
  markets?: string[];
  zoneCount: number;
  serviceCount: number;
  availabilityCount: number;
  upcomingAssignments?: number;
}): CleanerCoverageRow {
  const missing: string[] = [];
  if (!input.approved || input.onboardingStatus !== "APPROVED") missing.push("approval");
  if (!input.active) missing.push("active");
  if (!input.marketId && input.zoneCount === 0) missing.push("market_or_service_area");
  if (input.serviceCount === 0) missing.push("services");
  if (input.availabilityCount === 0) missing.push("availability");
  if (!input.isOnline) missing.push("online_for_offers");

  const bookable =
    input.approved &&
    input.active &&
    input.onboardingStatus === "APPROVED" &&
    input.serviceCount > 0 &&
    (input.zoneCount > 0 || Boolean(input.marketId)) &&
    input.availabilityCount > 0;

  const eligibleToReceiveJobs =
    canReceiveJobOffers(
      input.onboardingStatus === "APPROVED" ? "APPROVED" : "NOT_STARTED",
      input.isOnline,
    ) &&
    input.approved &&
    input.active &&
    bookable;

  const markets =
    input.markets && input.markets.length > 0
      ? input.markets
      : input.marketId
        ? [input.marketId]
        : [];

  return {
    cleanerId: input.cleanerId,
    approved: input.approved,
    active: input.active,
    onboardingStatus: input.onboardingStatus,
    isOnline: input.isOnline,
    marketId: input.marketId,
    markets,
    zoneCount: input.zoneCount,
    serviceCount: input.serviceCount,
    availabilityCount: input.availabilityCount,
    eligibleToReceiveJobs,
    bookable,
    upcomingAssignments: input.upcomingAssignments ?? 0,
    missing,
  };
}

/**
 * Per-market traffic light — independent of other markets.
 * GREEN only with coverageReady (redundancy) + booking + launch flags.
 */
export function marketCoverageStatus(m: {
  launchReady: boolean;
  coverageReady: boolean;
  bookableCleaners: number;
  approvedCleaners: number;
  configuredActive: boolean;
}): LaunchCoverageStatus {
  if (!m.configuredActive) return "RED";
  if (m.launchReady && m.coverageReady) return "GREEN";
  if (m.approvedCleaners >= 1 || m.bookableCleaners >= 1) return "YELLOW";
  return "RED";
}

export function evaluateMarketCoverageReady(input: {
  configuredActive: boolean;
  bookableCleaners: number;
  availableCapacity: number;
  catalogServices: number;
  zonesWithCleaners: number;
  pricingReady: boolean;
}): boolean {
  return (
    input.configuredActive &&
    input.bookableCleaners >= COVERAGE_REDUNDANCY_MIN_BOOKABLE &&
    input.availableCapacity >= 1 &&
    input.catalogServices > 0 &&
    input.zonesWithCleaners >= 1 &&
    input.pricingReady
  );
}

/** Never prefer a market by name when cleaner market is unknown. */
export function pickCandidateFirstMarket(input: {
  markets: Array<{
    marketId: string;
    configuredActive: boolean;
    launchReady: boolean;
    coverageReady: boolean;
    approvedCleaners: number;
    bookableCleaners: number;
  }>;
}): string | null {
  const ready = input.markets.find((m) => m.configuredActive && m.launchReady);
  if (ready) return ready.marketId;
  const coverage = input.markets.find((m) => m.configuredActive && m.coverageReady);
  if (coverage) return coverage.marketId;
  // Do not invent TORONTO_GTA preference — require attributed cleaners.
  const withBookable = input.markets
    .filter((m) => m.configuredActive && m.bookableCleaners > 0)
    .sort((a, b) => b.bookableCleaners - a.bookableCleaners)[0];
  if (withBookable) return withBookable.marketId;
  const withApproved = input.markets
    .filter((m) => m.configuredActive && m.approvedCleaners > 0)
    .sort((a, b) => b.approvedCleaners - a.approvedCleaners)[0];
  return withApproved?.marketId ?? null;
}

export function overallCoverageStatus(markets: MarketLaunchCoverage[]): LaunchCoverageStatus {
  // Informational only — never use as a single launch gate across markets.
  if (markets.some((m) => m.status === "GREEN")) return "GREEN";
  if (markets.some((m) => m.status === "YELLOW")) return "YELLOW";
  return "RED";
}

export async function buildLaunchCoverageSnapshot(): Promise<LaunchCoverageSnapshot> {
  const gaps: string[] = [];
  if (!hasAdminEnv()) {
    return {
      generatedAt: new Date().toISOString(),
      available: false,
      overallStatus: "RED",
      cleanerCoverageReady: false,
      recommendedFirstMarket: null,
      candidateFirstMarket: null,
      totals: {
        totalCleaners: 0,
        approvedCleaners: 0,
        bookableCleaners: 0,
        cleanersWithAvailability: 0,
        eligibleOnline: 0,
        unassignedApprovedCleaners: 0,
      },
      cleaners: [],
      markets: [],
      gaps: ["Database admin env not configured."],
    };
  }

  const supabase = createAdminClient();
  const flagSnapshots = await loadMarketFlagSnapshots();
  const flagsById = new Map(flagSnapshots.map((f) => [f.marketId, f]));

  const [
    cleanersRes,
    zonesRes,
    servicesRes,
    availRes,
    assignRes,
    marketsRes,
    marketServicesRes,
    serviceZonesRes,
  ] = await Promise.all([
    supabase
      .from("cleaners")
      .select("id, user_id, approved, is_active, onboarding_status, is_online, market_id")
      .limit(500),
    supabase.from("cleaner_service_zones").select("cleaner_id, zone_id").limit(5000),
    supabase.from("cleaner_services").select("cleaner_id").limit(5000),
    supabase.from("professional_availability").select("professional_profile_id").limit(5000),
    supabase
      .from("cleaner_assignments")
      .select("cleaner_id, status")
      .eq("status", "active")
      .limit(2000),
    supabase
      .from("markets")
      .select("id, name, active, currency, booking_enabled, launch_enabled")
      .limit(50),
    supabase.from("market_services").select("market_id, service_id").limit(500),
    supabase.from("service_zones").select("id, market_id").limit(500),
  ]);

  if (cleanersRes.error) gaps.push(cleanersRes.error.message);

  const zoneToMarket = new Map(
    (serviceZonesRes.data ?? []).map((z) => {
      const r = z as { id: string; market_id: string };
      return [r.id, r.market_id];
    }),
  );
  // Config zones fill gaps when DB zone list is incomplete (e.g. zone_gta_north).
  for (const marketId of LAUNCH_MARKET_IDS) {
    for (const zone of getZonesForMarket(marketId)) {
      if (!zoneToMarket.has(zone.id)) zoneToMarket.set(zone.id, marketId);
    }
  }

  const zoneCounts = new Map<string, number>();
  const cleanerMarkets = new Map<string, Set<string>>();
  const zonesWithCleanerByMarket = new Map<string, Set<string>>();
  for (const row of zonesRes.data ?? []) {
    const r = row as { cleaner_id: string; zone_id: string };
    const id = String(r.cleaner_id);
    zoneCounts.set(id, (zoneCounts.get(id) ?? 0) + 1);
    const marketId = zoneToMarket.get(String(r.zone_id));
    if (marketId) {
      const set = cleanerMarkets.get(id) ?? new Set<string>();
      set.add(marketId);
      cleanerMarkets.set(id, set);
      const zset = zonesWithCleanerByMarket.get(marketId) ?? new Set<string>();
      zset.add(String(r.zone_id));
      zonesWithCleanerByMarket.set(marketId, zset);
    }
  }

  const serviceCounts = new Map<string, number>();
  for (const row of servicesRes.data ?? []) {
    const id = String((row as { cleaner_id: string }).cleaner_id);
    serviceCounts.set(id, (serviceCounts.get(id) ?? 0) + 1);
  }
  const availCounts = new Map<string, number>();
  for (const row of availRes.data ?? []) {
    const id = String((row as { professional_profile_id: string }).professional_profile_id);
    availCounts.set(id, (availCounts.get(id) ?? 0) + 1);
  }
  const upcomingByCleaner = new Map<string, number>();
  for (const row of assignRes.data ?? []) {
    const id = String((row as { cleaner_id: string }).cleaner_id);
    upcomingByCleaner.set(id, (upcomingByCleaner.get(id) ?? 0) + 1);
  }

  const catalogByMarket = new Map<string, number>();
  for (const row of marketServicesRes.data ?? []) {
    const mid = String((row as { market_id: string }).market_id);
    catalogByMarket.set(mid, (catalogByMarket.get(mid) ?? 0) + 1);
  }

  const dbMarkets = new Map(
    (marketsRes.data ?? []).map((m) => {
      const r = m as {
        id: string;
        name: string;
        active: boolean;
        currency?: string;
        booking_enabled?: boolean;
        launch_enabled?: boolean;
      };
      return [r.id, r];
    }),
  );

  const cleaners: CleanerCoverageRow[] = (cleanersRes.data ?? []).map((raw) => {
    const c = raw as {
      id: string;
      user_id: string | null;
      approved: boolean | null;
      is_active: boolean | null;
      onboarding_status: string | null;
      is_online: boolean | null;
      market_id: string | null;
    };
    if (c.market_id) {
      const set = cleanerMarkets.get(c.id) ?? new Set<string>();
      set.add(c.market_id);
      cleanerMarkets.set(c.id, set);
    }
    const profileKey = c.user_id ? String(c.user_id) : c.id;
    const markets = Array.from(cleanerMarkets.get(c.id) ?? []);
    return evaluateCleanerCoverage({
      cleanerId: c.id,
      approved: Boolean(c.approved),
      active: Boolean(c.is_active),
      onboardingStatus: String(c.onboarding_status ?? "NOT_STARTED"),
      isOnline: Boolean(c.is_online),
      marketId: c.market_id,
      markets,
      zoneCount: zoneCounts.get(c.id) ?? 0,
      serviceCount: serviceCounts.get(c.id) ?? 0,
      availabilityCount: availCounts.get(profileKey) ?? availCounts.get(c.id) ?? 0,
      upcomingAssignments: upcomingByCleaner.get(c.id) ?? 0,
    });
  });

  const cleanerById = new Map(cleaners.map((c) => [c.cleanerId, c]));

  // Focus owner launch view on launch markets + any other configured active markets.
  const marketIds = new Set<string>([
    ...LAUNCH_MARKET_IDS,
    ...MARKETS.filter((m) => m.active).map((m) => m.id),
    ...dbMarkets.keys(),
  ]);

  const markets: MarketLaunchCoverage[] = Array.from(marketIds).map((marketId) => {
    const cfg = MARKETS.find((m) => m.id === marketId);
    const db = dbMarkets.get(marketId);
    const flags = flagsById.get(marketId);
    const configuredActive = Boolean(flags?.active ?? cfg?.active ?? db?.active);
    const bookingEnabled = Boolean(
      flags?.bookingEnabled ??
        (typeof db?.booking_enabled === "boolean" ? db.booking_enabled : cfg?.bookingEnabled),
    );
    const launchEnabled = Boolean(
      flags?.launchEnabled ??
        (typeof db?.launch_enabled === "boolean" ? db.launch_enabled : cfg?.launchEnabled),
    );
    const marketName = db?.name ?? cfg?.name ?? marketId;
    const currency = (flags?.currency ??
      (db?.currency === "CAD" || db?.currency === "USD" ? db.currency : cfg?.currency) ??
      null) as "CAD" | "USD" | null;

    const inMarketIds = new Set<string>();
    for (const [cleanerId, set] of cleanerMarkets) {
      if (set.has(marketId)) inMarketIds.add(cleanerId);
    }
    const inMarket = Array.from(inMarketIds)
      .map((id) => cleanerById.get(id))
      .filter((c): c is CleanerCoverageRow => Boolean(c));

    const approvedCleaners = inMarket.filter((c) => c.approved && c.active).length;
    const bookableCleaners = inMarket.filter((c) => c.bookable).length;
    const availableCapacity = inMarket.filter((c) => c.bookable && c.isOnline).length;
    const availableToday = availableCapacity;
    const servicesCovered = inMarket.reduce((sum, c) => sum + (c.serviceCount > 0 ? 1 : 0), 0);
    const catalogServices = catalogByMarket.get(marketId) ?? 0;
    const zonesConfigured =
      getZonesForMarket(marketId).length ||
      Array.from(zoneToMarket.values()).filter((m) => m === marketId).length;
    const zonesWithCleaners = zonesWithCleanerByMarket.get(marketId)?.size ?? 0;

    const pricing = marketPricingReady(marketId);
    const currencyReady = currency === "CAD" || currency === "USD";

    const majorGaps: string[] = [];
    if (!configuredActive) majorGaps.push("Market inactive in config/DB");
    if (!bookingEnabled) majorGaps.push("booking_enabled=false");
    if (!launchEnabled) majorGaps.push("launch_enabled=false");
    if (approvedCleaners === 0) {
      majorGaps.push("No approved active cleaner attributed to this market");
    }
    if (bookableCleaners === 0) {
      majorGaps.push("No bookable cleaner (needs zones + services + availability)");
    } else if (bookableCleaners < COVERAGE_REDUNDANCY_MIN_BOOKABLE) {
      majorGaps.push(
        `Only ${bookableCleaners} bookable cleaner(s) — need ≥${COVERAGE_REDUNDANCY_MIN_BOOKABLE} for coverage GREEN`,
      );
    }
    if (availableCapacity === 0) majorGaps.push("No online capacity for auto-offers");
    if (catalogServices === 0) majorGaps.push("No catalog services linked");
    if (zonesWithCleaners === 0) majorGaps.push("No cleaner-covered zones");
    if (!pricing.ready) majorGaps.push(pricing.reason);
    if (!currencyReady) majorGaps.push("Currency not CAD/USD");

    const coverageReady = evaluateMarketCoverageReady({
      configuredActive,
      bookableCleaners,
      availableCapacity,
      catalogServices,
      zonesWithCleaners,
      pricingReady: pricing.ready,
    });

    const launchReady =
      configuredActive && bookingEnabled && launchEnabled && coverageReady;

    const status = marketCoverageStatus({
      launchReady,
      coverageReady,
      bookableCleaners,
      approvedCleaners,
      configuredActive,
    });

    const geographicCoverage =
      zonesWithCleaners > 0
        ? `${zonesWithCleaners}/${zonesConfigured || "?"} zones with cleaners · ${bookableCleaners} bookable`
        : approvedCleaners > 0
          ? "Approved cleaner present but incomplete geo/services/availability"
          : "None — no cleaner tied to this market";

    return {
      marketId,
      marketName,
      configuredActive,
      bookingEnabled,
      launchEnabled,
      approvedCleaners,
      bookableCleaners,
      availableToday,
      availableCapacity,
      servicesCovered,
      catalogServices,
      zonesConfigured,
      zonesWithCleaners,
      geographicCoverage,
      majorGaps,
      pricingReady: pricing.ready,
      currencyReady,
      currency,
      coverageReady,
      launchReady,
      status,
    };
  });

  const launchMarkets = markets.filter((m) =>
    (LAUNCH_MARKET_IDS as readonly string[]).includes(m.marketId),
  );
  const candidateFirstMarket = pickCandidateFirstMarket({ markets: launchMarkets });
  const recommendedFirstMarket =
    launchMarkets.find((m) => m.launchReady)?.marketId ?? null;

  const unassignedApproved = cleaners.filter(
    (c) => c.approved && c.active && !c.marketId && c.zoneCount === 0,
  );
  if (unassignedApproved.length > 0) {
    gaps.push(
      `${unassignedApproved.length} approved active cleaner(s) have no market_id and 0 service zones — EXISTING_CLEANER_REAL_MARKET = HUMAN_INPUT_REQUIRED.`,
    );
  }
  if (cleaners.every((c) => !c.bookable)) {
    gaps.push("Zero bookable cleaners marketplace-wide.");
  }
  gaps.push(
    "Customer arrival windows still default to available when supplyByWindow is omitted (preference UX) — do not treat UI slots as proven capacity.",
  );
  gaps.push(
    "Per-market statuses are independent — do not combine TORONTO_GTA + SOUTH_FLORIDA for launch readiness.",
  );

  const totals = {
    totalCleaners: cleaners.length,
    approvedCleaners: cleaners.filter((c) => c.approved && c.active).length,
    bookableCleaners: cleaners.filter((c) => c.bookable).length,
    cleanersWithAvailability: cleaners.filter((c) => c.availabilityCount > 0).length,
    eligibleOnline: cleaners.filter((c) => c.eligibleToReceiveJobs).length,
    unassignedApprovedCleaners: unassignedApproved.length,
  };

  return {
    generatedAt: new Date().toISOString(),
    available: !cleanersRes.error,
    overallStatus: overallCoverageStatus(launchMarkets.length ? launchMarkets : markets),
    cleanerCoverageReady: Boolean(recommendedFirstMarket),
    recommendedFirstMarket,
    candidateFirstMarket,
    totals,
    cleaners,
    markets: markets.sort((a, b) => {
      const aLaunch = (LAUNCH_MARKET_IDS as readonly string[]).includes(a.marketId) ? 1 : 0;
      const bLaunch = (LAUNCH_MARKET_IDS as readonly string[]).includes(b.marketId) ? 1 : 0;
      if (aLaunch !== bLaunch) return bLaunch - aLaunch;
      return Number(b.configuredActive) - Number(a.configuredActive);
    }),
    gaps,
  };
}
