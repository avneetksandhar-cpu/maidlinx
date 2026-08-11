import { ACTIVE_JOB_STATUSES } from "@/lib/bookings/status";
import { createAdminClient } from "@/lib/supabase/admin";

export interface EarningsSummary {
  totalEarnedCents: number;
  pendingCents: number;
  completedJobs: number;
  currency: string;
}

export interface EarningsEntry {
  id: string;
  serviceType: string;
  scheduledAt: string;
  completedAt: string | null;
  earningsCents: number;
  currency: string;
  status: string;
}

export async function getEarningsSummary(profileId: string): Promise<EarningsSummary> {
  const supabase = createAdminClient();

  const { data: completed, error: completedError } = await supabase
    .from("bookings")
    .select("subtotal_cents, currency")
    .eq("professional_profile_id", profileId)
    .eq("status", "completed");

  if (completedError) throw new Error(completedError.message);

  const { data: pending, error: pendingError } = await supabase
    .from("bookings")
    .select("subtotal_cents")
    .eq("professional_profile_id", profileId)
    .in("status", ACTIVE_JOB_STATUSES);

  if (pendingError) throw new Error(pendingError.message);

  const totalEarnedCents = (completed ?? []).reduce(
    (sum, row) => sum + Number(row.subtotal_cents),
    0,
  );
  const pendingCents = (pending ?? []).reduce(
    (sum, row) => sum + Number(row.subtotal_cents),
    0,
  );

  return {
    totalEarnedCents,
    pendingCents,
    completedJobs: completed?.length ?? 0,
    currency: completed?.[0]?.currency ?? "USD",
  };
}

export async function getEarningsHistory(profileId: string): Promise<EarningsEntry[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("bookings")
    .select("id, service_type, scheduled_at, completed_at, subtotal_cents, currency, status")
    .eq("professional_profile_id", profileId)
    .in("status", [...ACTIVE_JOB_STATUSES, "completed"])
    .order("scheduled_at", { ascending: false })
    .limit(50);

  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => {
    const record = row as Record<string, unknown>;
    return {
      id: String(record.id),
      serviceType: String(record.service_type),
      scheduledAt: String(record.scheduled_at),
      completedAt: record.completed_at ? String(record.completed_at) : null,
      earningsCents: Number(record.subtotal_cents),
      currency: String(record.currency),
      status: String(record.status),
    };
  });
}
