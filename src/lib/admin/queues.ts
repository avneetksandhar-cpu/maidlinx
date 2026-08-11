import { createAdminClient, hasAdminEnv } from "@/lib/supabase/admin";
import { normalizeOpsMarketKey, opsMarketLabel } from "@/lib/admin/market-ids";
import { normalizeBookingStatus } from "@/lib/bookings/status";

export const OPS_QUEUE_KEYS = [
  "needs_assignment",
  "cleaner_late",
  "payment_issue",
  "cancellation",
  "customer_issue",
  "re_clean_request",
] as const;

export type OpsQueueKey = (typeof OPS_QUEUE_KEYS)[number];

export const OPS_QUEUE_LABELS: Record<OpsQueueKey, string> = {
  needs_assignment: "Needs assignment",
  cleaner_late: "Cleaner late",
  payment_issue: "Payment issue",
  cancellation: "Cancellation",
  customer_issue: "Customer issue",
  re_clean_request: "Re-clean request",
};

export interface OpsQueueItem {
  id: string;
  bookingId: string | null;
  queue: OpsQueueKey;
  title: string;
  subtitle: string | null;
  status: string;
  marketKey: string;
  marketLabel: string;
  scheduledAt: string | null;
  createdAt: string;
  priority: "low" | "normal" | "high" | "urgent";
}

export interface OpsQueueSummary {
  key: OpsQueueKey;
  label: string;
  count: number;
}

const LATE_GRACE_MS = 30 * 60 * 1000;

function mapBookingRow(row: Record<string, unknown>): {
  id: string;
  status: string;
  marketId: string | null;
  scheduledAt: string | null;
  createdAt: string;
  customerName: string;
  city: string | null;
} {
  return {
    id: String(row.id),
    status: String(normalizeBookingStatus(String(row.status))),
    marketId: row.market_id ? String(row.market_id) : null,
    scheduledAt: row.scheduled_at ? String(row.scheduled_at) : null,
    createdAt: String(row.created_at),
    customerName:
      [row.customer_first_name, row.customer_last_name].filter(Boolean).join(" ") || "Customer",
    city: row.address_city ? String(row.address_city) : null,
  };
}

export async function getOpsQueueSummaries(): Promise<OpsQueueSummary[]> {
  const queues = await listOpsQueues();
  return OPS_QUEUE_KEYS.map((key) => ({
    key,
    label: OPS_QUEUE_LABELS[key],
    count: queues[key].length,
  }));
}

export async function listOpsQueues(
  filter?: OpsQueueKey,
): Promise<Record<OpsQueueKey, OpsQueueItem[]>> {
  const empty = Object.fromEntries(OPS_QUEUE_KEYS.map((k) => [k, [] as OpsQueueItem[]])) as Record<
    OpsQueueKey,
    OpsQueueItem[]
  >;

  if (!hasAdminEnv()) return empty;

  const supabase = createAdminClient();
  const now = Date.now();
  const dayAgo = new Date(now - 24 * 60 * 60 * 1000).toISOString();

  const { data: bookings, error } = await supabase
    .from("bookings")
    .select(
      `
      id, status, market_id, scheduled_at, created_at, cancelled_at,
      customer_first_name, customer_last_name, address_city,
      professional_profile_id, stripe_payment_intent_id
    `,
    )
    .order("scheduled_at", { ascending: true })
    .limit(500);

  if (error) {
    if (error.message.includes("bookings")) return empty;
    throw new Error(error.message);
  }

  const rows = (bookings ?? []).map((r) => mapBookingRow(r as Record<string, unknown>));
  const rawById = new Map(
    (bookings ?? []).map((r) => [String((r as { id: string }).id), r as Record<string, unknown>]),
  );

  for (const booking of rows) {
    const raw = rawById.get(booking.id)!;
    const marketKey = normalizeOpsMarketKey(booking.marketId);
    const marketLabel = opsMarketLabel(marketKey);
    const base = {
      bookingId: booking.id,
      marketKey,
      marketLabel,
      scheduledAt: booking.scheduledAt,
      createdAt: booking.createdAt,
      priority: "normal" as const,
    };

    if (
      booking.status === "awaiting_assignment" ||
      booking.status === "confirmed" ||
      (booking.status === "offered" && !raw.professional_profile_id)
    ) {
      empty.needs_assignment.push({
        ...base,
        id: `assign-${booking.id}`,
        queue: "needs_assignment",
        title: booking.customerName,
        subtitle: booking.city ? `${booking.city} · ${booking.status}` : booking.status,
        status: booking.status,
        priority: "high",
      });
    }

    const scheduledMs = booking.scheduledAt ? Date.parse(booking.scheduledAt) : NaN;
    const lateStatuses = new Set(["assigned", "accepted", "on_the_way"]);
    if (
      lateStatuses.has(booking.status) &&
      Number.isFinite(scheduledMs) &&
      now > scheduledMs + LATE_GRACE_MS
    ) {
      empty.cleaner_late.push({
        ...base,
        id: `late-${booking.id}`,
        queue: "cleaner_late",
        title: booking.customerName,
        subtitle: "Past arrival window without arrival",
        status: booking.status,
        priority: "urgent",
      });
    }

    if (booking.status === "pending_payment") {
      const ageMs = now - Date.parse(booking.createdAt);
      if (ageMs > 60 * 60 * 1000) {
        empty.payment_issue.push({
          ...base,
          id: `pay-${booking.id}`,
          queue: "payment_issue",
          title: booking.customerName,
          subtitle: "Pending payment > 1h",
          status: booking.status,
          priority: "high",
        });
      }
    }

    if (booking.status === "cancelled" && booking.createdAt >= dayAgo) {
      empty.cancellation.push({
        ...base,
        id: `cancel-${booking.id}`,
        queue: "cancellation",
        title: booking.customerName,
        subtitle: "Cancelled in last 24h",
        status: booking.status,
        priority: "normal",
      });
    }
  }

  const { data: failedPayments } = await supabase
    .from("payments")
    .select("id, booking_id, status, created_at, amount_cents")
    .eq("status", "failed")
    .gte("created_at", dayAgo)
    .limit(100);

  for (const payment of failedPayments ?? []) {
    const p = payment as Record<string, unknown>;
    const bookingId = p.booking_id ? String(p.booking_id) : null;
    empty.payment_issue.push({
      id: `payfail-${String(p.id)}`,
      bookingId,
      queue: "payment_issue",
      title: "Failed payment",
      subtitle: bookingId ? `Booking ${bookingId.slice(0, 8)}` : null,
      status: "failed",
      marketKey: "unassigned",
      marketLabel: "Unassigned",
      scheduledAt: null,
      createdAt: String(p.created_at),
      priority: "high",
    });
  }

  const { data: issues } = await supabase
    .from("support_issues")
    .select("*")
    .in("status", ["open", "investigating"])
    .order("created_at", { ascending: false })
    .limit(200);

  for (const issue of issues ?? []) {
    const r = issue as Record<string, unknown>;
    const issueType = String(r.issue_type);
    const queue: OpsQueueKey | null =
      issueType === "re_clean_request"
        ? "re_clean_request"
        : issueType === "customer_issue"
          ? "customer_issue"
          : issueType === "payment_issue"
            ? "payment_issue"
            : issueType === "cancellation"
              ? "cancellation"
              : issueType === "cleaner_late"
                ? "cleaner_late"
                : "customer_issue";

    empty[queue].push({
      id: String(r.id),
      bookingId: r.booking_id ? String(r.booking_id) : null,
      queue,
      title: String(r.subject),
      subtitle: r.description ? String(r.description).slice(0, 120) : null,
      status: String(r.status),
      marketKey: "unassigned",
      marketLabel: "Unassigned",
      scheduledAt: null,
      createdAt: String(r.created_at),
      priority: (String(r.priority) as OpsQueueItem["priority"]) || "normal",
    });
  }

  // Also surface open disputes as customer issues.
  const { data: disputes } = await supabase
    .from("disputes")
    .select("id, booking_id, subject, description, status, created_at")
    .in("status", ["open", "investigating"])
    .limit(100);

  for (const dispute of disputes ?? []) {
    const r = dispute as Record<string, unknown>;
    empty.customer_issue.push({
      id: `dispute-${String(r.id)}`,
      bookingId: r.booking_id ? String(r.booking_id) : null,
      queue: "customer_issue",
      title: String(r.subject),
      subtitle: r.description ? String(r.description).slice(0, 120) : "Open dispute",
      status: String(r.status),
      marketKey: "unassigned",
      marketLabel: "Unassigned",
      scheduledAt: null,
      createdAt: String(r.created_at),
      priority: "high",
    });
  }

  if (filter) {
    const filtered = empty;
    for (const key of OPS_QUEUE_KEYS) {
      if (key !== filter) filtered[key] = [];
    }
    return filtered;
  }

  return empty;
}
