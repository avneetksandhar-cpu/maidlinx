/**
 * Retention intelligence — behavioral segments only (no protected traits).
 * Recommendations are advisory; never auto-charge or auto-message fabrication.
 */

import { createAdminClient, hasAdminEnv } from "@/lib/supabase/admin";
import { BRAIN_MIN_SAMPLE_SIZE } from "@/lib/brain/types";

export type RetentionSegment =
  | "new"
  | "active"
  | "at_risk"
  | "lapsed"
  | "unknown";

export interface RetentionIntel {
  status: "ok" | "INSUFFICIENT_DATA";
  sampleSize: number;
  segments: Record<RetentionSegment, number>;
  rebookRatePct: number | null;
}

export function segmentFromHistory(input: {
  completedCount: number;
  daysSinceLastCompleted: number | null;
}): RetentionSegment {
  if (input.completedCount <= 0) return "new";
  if (input.daysSinceLastCompleted == null) return "unknown";
  if (input.daysSinceLastCompleted <= 45) return "active";
  if (input.daysSinceLastCompleted <= 90) return "at_risk";
  return "lapsed";
}

export async function retentionIntelligenceSummary(): Promise<RetentionIntel> {
  const empty: RetentionIntel = {
    status: "INSUFFICIENT_DATA",
    sampleSize: 0,
    segments: { new: 0, active: 0, at_risk: 0, lapsed: 0, unknown: 0 },
    rebookRatePct: null,
  };

  if (!hasAdminEnv()) return empty;

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("bookings")
    .select("customer_id, status, completed_at, created_at")
    .eq("status", "completed")
    .limit(2000);

  if (error || !data || data.length === 0) return empty;

  const byCustomer = new Map<string, { count: number; last: number }>();
  for (const row of data) {
    const cid = row.customer_id ? String(row.customer_id) : null;
    if (!cid) continue;
    const ts = new Date(String(row.completed_at ?? row.created_at)).getTime();
    const prev = byCustomer.get(cid);
    if (!prev) byCustomer.set(cid, { count: 1, last: ts });
    else {
      prev.count += 1;
      prev.last = Math.max(prev.last, ts);
    }
  }

  const now = Date.now();
  const segments: RetentionIntel["segments"] = {
    new: 0,
    active: 0,
    at_risk: 0,
    lapsed: 0,
    unknown: 0,
  };

  let multi = 0;
  for (const [, v] of byCustomer) {
    const days = Math.floor((now - v.last) / (24 * 60 * 60 * 1000));
    const seg = segmentFromHistory({
      completedCount: v.count,
      daysSinceLastCompleted: days,
    });
    segments[seg] += 1;
    if (v.count >= 2) multi += 1;
  }

  const sampleSize = byCustomer.size;
  return {
    status: sampleSize >= BRAIN_MIN_SAMPLE_SIZE ? "ok" : "INSUFFICIENT_DATA",
    sampleSize,
    segments,
    rebookRatePct:
      sampleSize > 0 ? Number(((multi / sampleSize) * 100).toFixed(1)) : null,
  };
}
