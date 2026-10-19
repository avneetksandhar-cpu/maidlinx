/**
 * Cleaner capacity dashboard data — market / day / zone / service as available.
 */

import { createAdminClient, hasAdminEnv } from "@/lib/supabase/admin";

export interface CapacityBucket {
  key: string;
  label: string;
  dimension: "market" | "zone" | "service" | "day" | "hour";
  bookingCount: number;
  completedCount: number;
  upcomingCount: number;
  cleanerCoverage: number | null;
  gapReason?: string;
}

export interface CleanerCapacitySnapshot {
  generatedAt: string;
  totalCleaners: number | null;
  activeCleaners: number | null;
  utilizationPct: number | null;
  byMarket: CapacityBucket[];
  byZone: CapacityBucket[];
  byService: CapacityBucket[];
  byDayOfWeek: CapacityBucket[];
  byHour: CapacityBucket[];
  available: boolean;
  gaps: string[];
}

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export async function buildCleanerCapacitySnapshot(): Promise<CleanerCapacitySnapshot> {
  const gaps: string[] = [];
  if (!hasAdminEnv()) {
    return {
      generatedAt: new Date().toISOString(),
      totalCleaners: null,
      activeCleaners: null,
      utilizationPct: null,
      byMarket: [],
      byZone: [],
      byService: [],
      byDayOfWeek: [],
      byHour: [],
      available: false,
      gaps: ["Database admin env not configured."],
    };
  }

  const supabase = createAdminClient();
  const [
    cleanersRes,
    activeRes,
    bookingsRes,
    marketsRes,
    zonesRes,
  ] = await Promise.all([
    supabase.from("professionals").select("*", { count: "exact", head: true }),
    supabase
      .from("professionals")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true),
    supabase
      .from("bookings")
      .select(
        "id, status, market_id, zone_id, service_zone_id, service_type, scheduled_at, completed_at",
      )
      .limit(3000),
    supabase.from("markets").select("id, name").limit(200),
    supabase.from("service_zones").select("id, name, market_id").limit(500),
  ]);

  if (bookingsRes.error) gaps.push(bookingsRes.error.message);
  if (marketsRes.error) gaps.push("Markets unavailable — showing raw market_id.");
  if (zonesRes.error) gaps.push("Zones unavailable — showing raw zone_id.");

  const marketNames = new Map(
    (marketsRes.data ?? []).map((m) => {
      const r = m as { id: string; name: string };
      return [r.id, r.name];
    }),
  );
  const zoneNames = new Map(
    (zonesRes.data ?? []).map((z) => {
      const r = z as { id: string; name: string };
      return [r.id, r.name];
    }),
  );

  const bookings = (bookingsRes.data ?? []) as Array<Record<string, unknown>>;
  const totalCleaners = cleanersRes.count ?? 0;
  const activeCleaners = activeRes.count ?? 0;
  const utilizationPct =
    totalCleaners > 0 ? Math.round((activeCleaners / totalCleaners) * 100) : null;

  function accumulate(
    map: Map<string, CapacityBucket>,
    key: string,
    label: string,
    dimension: CapacityBucket["dimension"],
    status: string,
  ) {
    let bucket = map.get(key);
    if (!bucket) {
      bucket = {
        key,
        label,
        dimension,
        bookingCount: 0,
        completedCount: 0,
        upcomingCount: 0,
        cleanerCoverage: null,
      };
      map.set(key, bucket);
    }
    bucket.bookingCount += 1;
    if (status === "completed") bucket.completedCount += 1;
    if (
      [
        "confirmed",
        "awaiting_assignment",
        "offered",
        "assigned",
        "on_the_way",
        "arrived",
        "in_progress",
      ].includes(status)
    ) {
      bucket.upcomingCount += 1;
    }
  }

  const byMarket = new Map<string, CapacityBucket>();
  const byZone = new Map<string, CapacityBucket>();
  const byService = new Map<string, CapacityBucket>();
  const byDay = new Map<string, CapacityBucket>();
  const byHour = new Map<string, CapacityBucket>();

  for (let d = 0; d < 7; d += 1) {
    byDay.set(String(d), {
      key: String(d),
      label: DAY_LABELS[d]!,
      dimension: "day",
      bookingCount: 0,
      completedCount: 0,
      upcomingCount: 0,
      cleanerCoverage: null,
    });
  }
  for (let h = 6; h <= 20; h += 1) {
    byHour.set(String(h), {
      key: String(h),
      label: `${h}:00`,
      dimension: "hour",
      bookingCount: 0,
      completedCount: 0,
      upcomingCount: 0,
      cleanerCoverage: null,
    });
  }

  for (const b of bookings) {
    const status = String(b.status);
    const marketId = b.market_id ? String(b.market_id) : "unknown";
    const zoneId = b.service_zone_id
      ? String(b.service_zone_id)
      : b.zone_id
        ? String(b.zone_id)
        : "unknown";
    const service = b.service_type ? String(b.service_type) : "unknown";
    const scheduled = b.scheduled_at ? new Date(String(b.scheduled_at)) : null;

    accumulate(
      byMarket,
      marketId,
      marketNames.get(marketId) ?? marketId,
      "market",
      status,
    );
    accumulate(byZone, zoneId, zoneNames.get(zoneId) ?? zoneId, "zone", status);
    accumulate(byService, service, service.replace(/_/g, " "), "service", status);

    if (scheduled && !Number.isNaN(scheduled.getTime())) {
      accumulate(
        byDay,
        String(scheduled.getDay()),
        DAY_LABELS[scheduled.getDay()]!,
        "day",
        status,
      );
      const hour = scheduled.getHours();
      if (hour >= 6 && hour <= 20) {
        accumulate(byHour, String(hour), `${hour}:00`, "hour", status);
      }
    }
  }

  const sortBuckets = (m: Map<string, CapacityBucket>) =>
    Array.from(m.values()).sort((a, b) => b.bookingCount - a.bookingCount);

  if (bookings.length === 0) {
    gaps.push("No bookings yet — capacity dimensions empty (honest gap).");
  }
  if (activeCleaners === 0) {
    gaps.push("No active cleaners — utilization undefined for supply fill.");
  }

  return {
    generatedAt: new Date().toISOString(),
    totalCleaners,
    activeCleaners,
    utilizationPct,
    byMarket: sortBuckets(byMarket).slice(0, 20),
    byZone: sortBuckets(byZone).slice(0, 20),
    byService: sortBuckets(byService).slice(0, 20),
    byDayOfWeek: Array.from(byDay.values()),
    byHour: Array.from(byHour.values()),
    available: !bookingsRes.error,
    gaps,
  };
}
