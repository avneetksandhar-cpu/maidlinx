import { createAdminClient, hasAdminEnv } from "@/lib/supabase/admin";

export interface DashboardMetrics {
  bookingsToday: number;
  revenueTodayCents: number;
  activeCleaners: number;
  pendingAssignments: number;
  completedBookings: number;
}

export const EMPTY_DASHBOARD_METRICS: DashboardMetrics = {
  bookingsToday: 0,
  revenueTodayCents: 0,
  activeCleaners: 0,
  pendingAssignments: 0,
  completedBookings: 0,
};

function todayBounds(): { start: string; end: string } {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start: start.toISOString(), end: end.toISOString() };
}

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  if (!hasAdminEnv()) {
    return EMPTY_DASHBOARD_METRICS;
  }

  const supabase = createAdminClient();
  const { start, end } = todayBounds();

  const [
    bookingsTodayRes,
    revenueTodayRes,
    activeCleanersRes,
    pendingAssignmentsRes,
    completedTodayRes,
  ] = await Promise.all([
    supabase
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .gte("scheduled_at", start)
      .lt("scheduled_at", end),
    supabase
      .from("bookings")
      .select("total_cents")
      .eq("status", "completed")
      .gte("completed_at", start)
      .lt("completed_at", end),
    supabase
      .from("professionals")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true),
    supabase
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .in("status", ["awaiting_assignment", "confirmed", "offered"])
      .is("professional_profile_id", null),
    supabase
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .eq("status", "completed")
      .gte("completed_at", start)
      .lt("completed_at", end),
  ]);

  const revenueTodayCents = (revenueTodayRes.data ?? []).reduce(
    (sum, row) => sum + Number(row.total_cents),
    0,
  );

  return {
    bookingsToday: bookingsTodayRes.count ?? 0,
    revenueTodayCents,
    activeCleaners: activeCleanersRes.count ?? 0,
    pendingAssignments: pendingAssignmentsRes.count ?? 0,
    completedBookings: completedTodayRes.count ?? 0,
  };
}

export interface PlatformMetrics {
  totalBookings: number;
  activeBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  totalRevenueCents: number;
  platformFeesCents: number;
  proPayoutsCents: number;
  platformMarginCents: number;
  averageOrderValueCents: number;
  repeatRatePercent: number;
  cancelRatePercent: number;
  totalCustomers: number;
  totalCleaners: number;
  activeCleaners: number;
  openDisputes: number;
  pendingRefunds: number;
}

export interface RevenuePoint {
  label: string;
  revenueCents: number;
  bookings: number;
}

export interface StatusBreakdown {
  status: string;
  count: number;
}

export async function getPlatformMetrics(): Promise<PlatformMetrics> {
  const supabase = createAdminClient();

  const [
    bookingsRes,
    customersRes,
    cleanersRes,
    activeCleanersRes,
    disputesRes,
    refundsRes,
  ] = await Promise.all([
    supabase
      .from("bookings")
      .select("status, total_cents, platform_fee_cents, subtotal_cents, customer_id, customer_email"),
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "customer"),
    supabase.from("professionals").select("*", { count: "exact", head: true }),
    supabase
      .from("professionals")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true),
    supabase
      .from("disputes")
      .select("*", { count: "exact", head: true })
      .in("status", ["open", "investigating"]),
    supabase.from("refunds").select("*", { count: "exact", head: true }).eq("status", "pending"),
  ]);

  const bookings = bookingsRes.data ?? [];
  const completed = bookings.filter((b) => b.status === "completed");
  const active = bookings.filter((b) =>
    [
      "pending_payment",
      "confirmed",
      "awaiting_assignment",
      "assigned",
      "on_the_way",
      "arrived",
      "in_progress",
    ].includes(String(b.status)),
  );
  const cancelled = bookings.filter((b) => b.status === "cancelled");

  const totalRevenueCents = completed.reduce((s, b) => s + Number(b.total_cents), 0);
  const platformFeesCents = completed.reduce((s, b) => s + Number(b.platform_fee_cents), 0);
  const proPayoutsCents = completed.reduce((s, b) => s + Number(b.subtotal_cents), 0);
  const platformMarginCents = Math.max(0, totalRevenueCents - proPayoutsCents);
  const averageOrderValueCents =
    completed.length > 0 ? Math.round(totalRevenueCents / completed.length) : 0;

  const customerKeys = new Map<string, number>();
  for (const b of completed) {
    const key = b.customer_id
      ? `id:${b.customer_id}`
      : b.customer_email
        ? `email:${String(b.customer_email).toLowerCase()}`
        : null;
    if (!key) continue;
    customerKeys.set(key, (customerKeys.get(key) ?? 0) + 1);
  }
  const customersWithCompleted = customerKeys.size;
  const repeatCustomers = Array.from(customerKeys.values()).filter((n) => n >= 2).length;
  const repeatRatePercent =
    customersWithCompleted > 0
      ? Math.round((repeatCustomers / customersWithCompleted) * 1000) / 10
      : 0;

  const decided = completed.length + cancelled.length;
  const cancelRatePercent =
    decided > 0 ? Math.round((cancelled.length / decided) * 1000) / 10 : 0;

  return {
    totalBookings: bookings.length,
    activeBookings: active.length,
    completedBookings: completed.length,
    cancelledBookings: cancelled.length,
    totalRevenueCents,
    platformFeesCents,
    proPayoutsCents,
    platformMarginCents,
    averageOrderValueCents,
    repeatRatePercent,
    cancelRatePercent,
    totalCustomers: customersRes.count ?? 0,
    totalCleaners: cleanersRes.count ?? 0,
    activeCleaners: activeCleanersRes.count ?? 0,
    openDisputes: disputesRes.count ?? 0,
    pendingRefunds: refundsRes.count ?? 0,
  };
}

export async function getRevenueTrend(days = 30): Promise<RevenuePoint[]> {
  const supabase = createAdminClient();
  const since = new Date();
  since.setDate(since.getDate() - days);

  const { data, error } = await supabase
    .from("bookings")
    .select("total_cents, created_at, status")
    .gte("created_at", since.toISOString())
    .eq("status", "completed");

  if (error) throw new Error(error.message);

  const buckets = new Map<string, { revenueCents: number; bookings: number }>();

  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    buckets.set(key, { revenueCents: 0, bookings: 0 });
  }

  for (const row of data ?? []) {
    const key = String(row.created_at).slice(0, 10);
    const bucket = buckets.get(key);
    if (bucket) {
      bucket.revenueCents += Number(row.total_cents);
      bucket.bookings += 1;
    }
  }

  return Array.from(buckets.entries()).map(([label, value]) => ({
    label: new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(
      new Date(label),
    ),
    revenueCents: value.revenueCents,
    bookings: value.bookings,
  }));
}

export async function getBookingStatusBreakdown(): Promise<StatusBreakdown[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from("bookings").select("status");

  if (error) throw new Error(error.message);

  const counts = new Map<string, number>();
  for (const row of data ?? []) {
    const status = String(row.status);
    counts.set(status, (counts.get(status) ?? 0) + 1);
  }

  return Array.from(counts.entries()).map(([status, count]) => ({ status, count }));
}

export async function getServiceTypeBreakdown(): Promise<Array<{ serviceType: string; count: number }>> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from("bookings").select("service_type");

  if (error) throw new Error(error.message);

  const counts = new Map<string, number>();
  for (const row of data ?? []) {
    const type = String(row.service_type);
    counts.set(type, (counts.get(type) ?? 0) + 1);
  }

  return Array.from(counts.entries()).map(([serviceType, count]) => ({ serviceType, count }));
}
