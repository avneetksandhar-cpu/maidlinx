/**
 * Customer revenue profile + next-best-action (deterministic, no LLM).
 */

import { createAdminClient, hasAdminEnv } from "@/lib/supabase/admin";
import { segmentFromHistory } from "@/lib/brain/retention";

export type CustomerNba =
  | "REBOOK"
  | "RECURRING"
  | "UPSELL"
  | "REFER"
  | "WIN_BACK"
  | "SERVICE_RECOVERY"
  | "LEAVE_ALONE";

export interface CustomerRevenueProfile {
  customerId: string;
  email: string | null;
  name: string | null;
  ltvCents: number;
  bookingCount: number;
  completedCount: number;
  cancelledCount: number;
  averageIntervalDays: number | null;
  daysSinceLastCompleted: number | null;
  lastCompletedAt: string | null;
  recurringPreference: string | null;
  hasCommercial: boolean;
  segment: string;
  nba: CustomerNba;
  nbaReason: string;
  available: boolean;
  gapReason?: string;
}

function pickNba(input: {
  completedCount: number;
  cancelledCount: number;
  daysSinceLast: number | null;
  recurringPreference: string | null;
  hasCommercial: boolean;
  avgInterval: number | null;
  segment: string;
}): { nba: CustomerNba; reason: string } {
  if (input.cancelledCount >= 2 && input.completedCount === 0) {
    return {
      nba: "SERVICE_RECOVERY",
      reason: "Multiple cancels with no completed jobs — recovery before push.",
    };
  }
  if (input.segment === "churned" || (input.daysSinceLast != null && input.daysSinceLast > 120)) {
    return {
      nba: "WIN_BACK",
      reason: "Long silence since last completed clean — win-back candidate.",
    };
  }
  if (
    input.daysSinceLast != null &&
    input.daysSinceLast >= 14 &&
    input.daysSinceLast <= 90 &&
    input.completedCount >= 1
  ) {
    return {
      nba: "REBOOK",
      reason: "In rebook window (14–90d) with prior completions.",
    };
  }
  if (
    input.completedCount >= 2 &&
    (!input.recurringPreference || input.recurringPreference === "one_time")
  ) {
    return {
      nba: "RECURRING",
      reason: "Repeat customer without recurring preference — cadence candidate.",
    };
  }
  if (input.hasCommercial || input.completedCount >= 3) {
    return {
      nba: "UPSELL",
      reason: "Commercial or high-frequency history — upsell / expand scope.",
    };
  }
  if (input.completedCount >= 2 && input.segment === "active") {
    return {
      nba: "REFER",
      reason: "Active repeat customer — referral ask when relationship is healthy.",
    };
  }
  if (input.daysSinceLast != null && input.daysSinceLast < 14) {
    return {
      nba: "LEAVE_ALONE",
      reason: "Recently cleaned — do not over-message.",
    };
  }
  return {
    nba: "LEAVE_ALONE",
    reason: "Insufficient signal for a push action.",
  };
}

function averageIntervalDays(timestamps: number[]): number | null {
  if (timestamps.length < 2) return null;
  const sorted = [...timestamps].sort((a, b) => a - b);
  let sum = 0;
  for (let i = 1; i < sorted.length; i += 1) {
    sum += sorted[i]! - sorted[i - 1]!;
  }
  return Math.round(sum / (sorted.length - 1) / 86_400_000);
}

export async function getCustomerRevenueProfile(
  customerId: string,
): Promise<CustomerRevenueProfile> {
  const empty: CustomerRevenueProfile = {
    customerId,
    email: null,
    name: null,
    ltvCents: 0,
    bookingCount: 0,
    completedCount: 0,
    cancelledCount: 0,
    averageIntervalDays: null,
    daysSinceLastCompleted: null,
    lastCompletedAt: null,
    recurringPreference: null,
    hasCommercial: false,
    segment: "unknown",
    nba: "LEAVE_ALONE",
    nbaReason: "Unavailable",
    available: false,
  };

  if (!hasAdminEnv()) {
    return { ...empty, gapReason: "Database not configured." };
  }

  try {
    const supabase = createAdminClient();
    const [profileRes, bookingsRes] = await Promise.all([
      supabase
        .from("profiles")
        .select("id, email, first_name, last_name")
        .eq("id", customerId)
        .maybeSingle(),
      // recurring_preference may lag in generated types — soft cast select.
      supabase
        .from("bookings")
        .select(
          "id, status, total_cents, completed_at, created_at, service_type, recurring_preference, customer_email, customer_first_name, customer_last_name" as never,
        )
        .eq("customer_id", customerId)
        .order("created_at", { ascending: false })
        .limit(200),
    ]);

    if (bookingsRes.error) {
      return { ...empty, gapReason: bookingsRes.error.message };
    }

    const bookings = (bookingsRes.data ?? []) as unknown as Array<Record<string, unknown>>;
    const completed = bookings.filter((b) => b.status === "completed");
    const cancelled = bookings.filter((b) => b.status === "cancelled");
    const ltvCents = completed.reduce(
      (s, b) => s + Number(b.total_cents ?? 0),
      0,
    );
    const completedTs = completed
      .map((b) => new Date(String(b.completed_at ?? b.created_at)).getTime())
      .filter((n) => Number.isFinite(n));
    const lastCompletedAt =
      completedTs.length > 0
        ? new Date(Math.max(...completedTs)).toISOString()
        : null;
    const daysSinceLast =
      lastCompletedAt != null
        ? Math.floor((Date.now() - new Date(lastCompletedAt).getTime()) / 86_400_000)
        : null;

    const recurring =
      bookings.find(
        (b) =>
          b.recurring_preference &&
          String(b.recurring_preference) !== "one_time",
      )?.recurring_preference ??
      bookings[0]?.recurring_preference ??
      null;

    const hasCommercial = bookings.some((b) =>
      ["commercial", "office", "airbnb_turnover"].includes(String(b.service_type)),
    );

    const segment = segmentFromHistory({
      completedCount: completed.length,
      daysSinceLastCompleted: daysSinceLast,
    });

    const { nba, reason } = pickNba({
      completedCount: completed.length,
      cancelledCount: cancelled.length,
      daysSinceLast,
      recurringPreference: recurring ? String(recurring) : null,
      hasCommercial,
      avgInterval: averageIntervalDays(completedTs),
      segment,
    });

    const profile = profileRes.data as Record<string, unknown> | null;
    const firstBooking = bookings[0];
    const email =
      (profile?.email ? String(profile.email) : null) ??
      (firstBooking?.customer_email ? String(firstBooking.customer_email) : null);
    const composedName = [
      profile?.first_name ?? firstBooking?.customer_first_name,
      profile?.last_name ?? firstBooking?.customer_last_name,
    ]
      .filter(Boolean)
      .map(String)
      .join(" ")
      .trim();
    const name = composedName || null;

    return {
      customerId,
      email,
      name: name || null,
      ltvCents,
      bookingCount: bookings.length,
      completedCount: completed.length,
      cancelledCount: cancelled.length,
      averageIntervalDays: averageIntervalDays(completedTs),
      daysSinceLastCompleted: daysSinceLast,
      lastCompletedAt,
      recurringPreference: recurring ? String(recurring) : null,
      hasCommercial,
      segment,
      nba,
      nbaReason: reason,
      available: true,
    };
  } catch (err) {
    return {
      ...empty,
      gapReason: err instanceof Error ? err.message : "Profile load failed.",
    };
  }
}

/** High-LTV inactive customers for opportunity engine. */
export async function huntInactiveHighLtv(limit = 50): Promise<{
  count: number;
  estimatedCents: number | null;
  customerIds: string[];
  available: boolean;
  gapReason?: string;
}> {
  if (!hasAdminEnv()) {
    return {
      count: 0,
      estimatedCents: null,
      customerIds: [],
      available: false,
      gapReason: "No admin env.",
    };
  }
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("bookings")
      .select("customer_id, total_cents, status, completed_at, created_at")
      .eq("status", "completed")
      .not("customer_id", "is", null)
      .limit(2000);

    if (error) {
      return {
        count: 0,
        estimatedCents: null,
        customerIds: [],
        available: false,
        gapReason: error.message,
      };
    }

    const by = new Map<string, { ltv: number; last: number }>();
    for (const row of data ?? []) {
      const r = row as Record<string, unknown>;
      const cid = String(r.customer_id);
      const ts = new Date(String(r.completed_at ?? r.created_at)).getTime();
      const prev = by.get(cid);
      if (!prev) {
        by.set(cid, { ltv: Number(r.total_cents ?? 0), last: ts });
      } else {
        prev.ltv += Number(r.total_cents ?? 0);
        if (ts > prev.last) prev.last = ts;
      }
    }

    const now = Date.now();
    const inactive = Array.from(by.entries())
      .filter(([, v]) => v.ltv >= 15000 && (now - v.last) / 86_400_000 >= 60)
      .sort((a, b) => b[1].ltv - a[1].ltv)
      .slice(0, limit);

    const estimated = inactive.reduce((s, [, v]) => s + v.ltv, 0);
    return {
      count: inactive.length,
      estimatedCents: estimated > 0 ? Math.round(estimated * 0.25) : null,
      customerIds: inactive.map(([id]) => id),
      available: true,
    };
  } catch (err) {
    return {
      count: 0,
      estimatedCents: null,
      customerIds: [],
      available: false,
      gapReason: err instanceof Error ? err.message : "Hunt failed.",
    };
  }
}
