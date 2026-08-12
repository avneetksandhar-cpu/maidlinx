/**
 * Launch cleaner coverage readiness — pure rules + DB snapshot builder.
 * Honest zeros; never invents capacity.
 */

import { MARKETS } from "@/config/markets";
import { canReceiveJobOffers } from "@/lib/cleaners/onboarding";
import { createAdminClient, hasAdminEnv } from "@/lib/supabase/admin";

export type LaunchCoverageStatus = "GREEN" | "YELLOW" | "RED";

export interface CleanerCoverageRow {
  cleanerId: string;
  approved: boolean;
  active: boolean;
  onboardingStatus: string;
  isOnline: boolean;
  marketId: string | null;
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
  approvedCleaners: number;
  bookableCleaners: number;
  availableCapacity: number;
  servicesCovered: number;
  catalogServices: number;
  geographicCoverage: string;
  majorGaps: string[];
  launchReady: boolean;
  status: LaunchCoverageStatus;
}

export interface LaunchCoverageSnapshot {
  generatedAt: string;
  available: boolean;
  overallStatus: LaunchCoverageStatus;
  cleanerCoverageReady: boolean;
  /** Only set when a market is truly launch-ready. */
  recommendedFirstMarket: string | null;
  /** Best ops candidate even when not launch-ready (may be null). */
  candidateFirstMarket: string | null;
  totals: {
    totalCleaners: number;
    approvedCleaners: number;
    bookableCleaners: number;
    cleanersWithAvailability: number;
    eligibleOnline: number;
  };
  cleaners: CleanerCoverageRow[];
  markets: MarketLaunchCoverage[];
  gaps: string[];
}

export function evaluateCleanerCoverage(input: {
  cleanerId: string;
  approved: boolean;
  active: boolean;
  onboardingStatus: string;
  isOnline: boolean;
  marketId: string | null;
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
    input.active;

  return {
    cleanerId: input.cleanerId,
    approved: input.approved,
    active: input.active,
    onboardingStatus: input.onboardingStatus,
    isOnline: input.isOnline,
    marketId: input.marketId,
    zoneCount: input.zoneCount,
    serviceCount: input.serviceCount,
    availabilityCount: input.availabilityCount,
    eligibleToReceiveJobs,
    bookable,
    upcomingAssignments: input.upcomingAssignments ?? 0,
    missing,
  };
}

export function marketCoverageStatus(m: {
  launchReady: boolean;
  bookableCleaners: number;
  approvedCleaners: number;
  configuredActive: boolean;
}): LaunchCoverageStatus {
  if (!m.configuredActive) return "RED";
  if (m.launchReady && m.bookableCleaners >= 1) return "GREEN";
  if (m.approvedCleaners >= 1) return "YELLOW";
  return "RED";
}

export function overallCoverageStatus(markets: MarketLaunchCoverage[]): LaunchCoverageStatus {
  if (markets.some((m) => m.status === "GREEN")) return "GREEN";
  if (markets.some((m) => m.status === "YELLOW")) return "YELLOW";
  return "RED";
}

/** Prefer TORONTO_GTA when demand history exists and an approved cleaner can be ops-dispatched. */
export function pickCandidateFirstMarket(input: {
  hasApprovedActiveCleaner: boolean;
  markets: Array<{ marketId: string; configuredActive: boolean; launchReady: boolean }>;
}): string | null {
  const ready = input.markets.find((m) => m.configuredActive && m.launchReady);
  if (ready) return ready.marketId;
  if (!input.hasApprovedActiveCleaner) return null;
  if (input.markets.some((m) => m.marketId === "TORONTO_GTA" && m.configuredActive)) {
    return "TORONTO_GTA";
  }
  return input.markets.find((m) => m.configuredActive)?.marketId ?? null;
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
      },
      cleaners: [],
      markets: [],
      gaps: ["Database admin env not configured."],
    };
  }

  const supabase = createAdminClient();
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
    supabase.from("markets").select("id, name, active").limit(50),
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

  const zoneCounts = new Map<string, number>();
  const cleanerMarkets = new Map<string, Set<string>>();
  for (const row of zonesRes.data ?? []) {
    const r = row as { cleaner_id: string; zone_id: string };
    const id = String(r.cleaner_id);
    zoneCounts.set(id, (zoneCounts.get(id) ?? 0) + 1);
    const marketId = zoneToMarket.get(String(r.zone_id));
    if (marketId) {
      const set = cleanerMarkets.get(id) ?? new Set<string>();
      set.add(marketId);
      cleanerMarkets.set(id, set);
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
      const r = m as { id: string; name: string; active: boolean };
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
    return evaluateCleanerCoverage({
      cleanerId: c.id,
      approved: Boolean(c.approved),
      active: Boolean(c.is_active),
      onboardingStatus: String(c.onboarding_status ?? "NOT_STARTED"),
      isOnline: Boolean(c.is_online),
      marketId: c.market_id,
      zoneCount: zoneCounts.get(c.id) ?? 0,
      serviceCount: serviceCounts.get(c.id) ?? 0,
      availabilityCount: availCounts.get(profileKey) ?? availCounts.get(c.id) ?? 0,
      upcomingAssignments: upcomingByCleaner.get(c.id) ?? 0,
    });
  });

  const cleanerById = new Map(cleaners.map((c) => [c.cleanerId, c]));

  const marketIds = new Set<string>([...MARKETS.map((m) => m.id), ...dbMarkets.keys()]);

  const markets: MarketLaunchCoverage[] = Array.from(marketIds).map((marketId) => {
    const cfg = MARKETS.find((m) => m.id === marketId);
    const db = dbMarkets.get(marketId);
    const configuredActive = Boolean(cfg?.active ?? db?.active);
    const marketName = db?.name ?? cfg?.name ?? marketId;

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
    const servicesCovered = inMarket.reduce((sum, c) => sum + (c.serviceCount > 0 ? 1 : 0), 0);
    const catalogServices = catalogByMarket.get(marketId) ?? 0;

    const majorGaps: string[] = [];
    if (!configuredActive) majorGaps.push("Market inactive in config/DB");
    if (approvedCleaners === 0) {
      majorGaps.push("No approved active cleaner assigned to this market");
    }
    if (bookableCleaners === 0) {
      majorGaps.push("No bookable cleaner (needs zones + services + availability)");
    }
    if (availableCapacity === 0) majorGaps.push("No online capacity for auto-offers");
    if (catalogServices === 0) majorGaps.push("No catalog services linked");

    const launchReady =
      configuredActive && bookableCleaners >= 1 && availableCapacity >= 1 && catalogServices > 0;

    const status = marketCoverageStatus({
      launchReady,
      bookableCleaners,
      approvedCleaners,
      configuredActive,
    });

    const geographicCoverage =
      bookableCleaners > 0
        ? `${bookableCleaners} bookable cleaner(s) with service areas`
        : approvedCleaners > 0
          ? "Approved cleaner present but incomplete geo/services/availability"
          : "None — no cleaner tied to this market";

    return {
      marketId,
      marketName,
      configuredActive,
      approvedCleaners,
      bookableCleaners,
      availableCapacity,
      servicesCovered,
      catalogServices,
      geographicCoverage,
      majorGaps,
      launchReady,
      status,
    };
  });

  const activeMarkets = markets.filter((m) => m.configuredActive);
  const hasApprovedActive = cleaners.some((c) => c.approved && c.active);
  const candidateFirstMarket = pickCandidateFirstMarket({
    hasApprovedActiveCleaner: hasApprovedActive,
    markets,
  });
  const recommendedFirstMarket =
    activeMarkets.find((m) => m.launchReady)?.marketId ?? null;

  const unassignedApproved = cleaners.filter(
    (c) => c.approved && c.active && !c.marketId && c.zoneCount === 0,
  );
  if (unassignedApproved.length > 0) {
    gaps.push(
      `${unassignedApproved.length} approved active cleaner(s) have no market_id and 0 service zones — not attributed to any launch market.`,
    );
  }
  if (cleaners.every((c) => !c.bookable)) {
    gaps.push("Zero bookable cleaners marketplace-wide.");
  }
  gaps.push(
    "Customer arrival windows still default to available when supplyByWindow is omitted (preference UX) — do not treat UI slots as proven capacity.",
  );

  const totals = {
    totalCleaners: cleaners.length,
    approvedCleaners: cleaners.filter((c) => c.approved && c.active).length,
    bookableCleaners: cleaners.filter((c) => c.bookable).length,
    cleanersWithAvailability: cleaners.filter((c) => c.availabilityCount > 0).length,
    eligibleOnline: cleaners.filter((c) => c.eligibleToReceiveJobs).length,
  };

  return {
    generatedAt: new Date().toISOString(),
    available: !cleanersRes.error,
    overallStatus: overallCoverageStatus(activeMarkets.length ? activeMarkets : markets),
    cleanerCoverageReady: Boolean(recommendedFirstMarket),
    recommendedFirstMarket,
    candidateFirstMarket,
    totals,
    cleaners,
    markets: markets.sort((a, b) => Number(b.configuredActive) - Number(a.configuredActive)),
    gaps,
  };
}
