/**
 * Quality REVIEW_SIGNALS — never auto-fire discipline or suspension.
 */

import { createAdminClient, hasAdminEnv } from "@/lib/supabase/admin";

export async function raiseQualityReviewSignal(input: {
  bookingId?: string | null;
  cleanerId?: string | null;
  signalCode: string;
  severity?: "low" | "medium" | "high" | "critical";
  payload?: Record<string, unknown>;
}): Promise<{ id: string | null }> {
  if (!hasAdminEnv()) return { id: null };
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("brain_quality_signals")
    .insert({
      booking_id: input.bookingId ?? null,
      cleaner_id: input.cleanerId ?? null,
      signal_code: input.signalCode,
      severity: input.severity ?? "low",
      status: "REVIEW_SIGNAL",
      payload: input.payload ?? {},
    } as never)
    .select("id")
    .maybeSingle();

  if (error) return { id: null };
  const row = data as { id?: string } | null;
  return { id: row?.id ? String(row.id) : null };
}

/** Low ratings → REVIEW_SIGNAL only. */
export async function maybeSignalLowRating(input: {
  bookingId: string;
  cleanerId?: string | null;
  rating: number;
}): Promise<void> {
  if (input.rating > 2) return;
  await raiseQualityReviewSignal({
    bookingId: input.bookingId,
    cleanerId: input.cleanerId,
    signalCode: "low_rating",
    severity: input.rating <= 1 ? "high" : "medium",
    payload: { rating: input.rating },
  });
}

export async function listOpenQualitySignals(limit = 50): Promise<
  Array<{
    id: string;
    signalCode: string;
    severity: string;
    bookingId: string | null;
    cleanerId: string | null;
    createdAt: string;
  }>
> {
  if (!hasAdminEnv()) return [];
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("brain_quality_signals")
    .select("id, signal_code, severity, booking_id, cleaner_id, created_at")
    .eq("status", "REVIEW_SIGNAL")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return (data as Array<Record<string, unknown>>).map((r) => ({
    id: String(r.id),
    signalCode: String(r.signal_code),
    severity: String(r.severity),
    bookingId: r.booking_id ? String(r.booking_id) : null,
    cleanerId: r.cleaner_id ? String(r.cleaner_id) : null,
    createdAt: String(r.created_at),
  }));
}
