import { createAdminClient } from "@/lib/supabase/admin";

export interface UnavailableDate {
  id: string;
  cleanerId: string;
  unavailableDate: string;
  reason: string | null;
}

export async function listUnavailableDates(cleanerId: string): Promise<UnavailableDate[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("cleaner_unavailable_dates")
    .select("*")
    .eq("cleaner_id", cleanerId)
    .order("unavailable_date", { ascending: true });

  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => {
    const record = row as Record<string, unknown>;
    return {
      id: String(record.id),
      cleanerId: String(record.cleaner_id),
      unavailableDate: String(record.unavailable_date),
      reason: record.reason ? String(record.reason) : null,
    };
  });
}

export async function addUnavailableDate(input: {
  cleanerId: string;
  unavailableDate: string;
  reason?: string | null;
}): Promise<UnavailableDate> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("cleaner_unavailable_dates")
    .upsert(
      {
        cleaner_id: input.cleanerId,
        unavailable_date: input.unavailableDate,
        reason: input.reason ?? null,
      },
      { onConflict: "cleaner_id,unavailable_date" },
    )
    .select("*")
    .single();

  if (error || !data) throw new Error(error?.message ?? "Unable to block date.");

  const record = data as Record<string, unknown>;
  return {
    id: String(record.id),
    cleanerId: String(record.cleaner_id),
    unavailableDate: String(record.unavailable_date),
    reason: record.reason ? String(record.reason) : null,
  };
}

export async function removeUnavailableDate(
  cleanerId: string,
  unavailableDate: string,
): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("cleaner_unavailable_dates")
    .delete()
    .eq("cleaner_id", cleanerId)
    .eq("unavailable_date", unavailableDate);

  if (error) throw new Error(error.message);
}

/** Pure helper for matching — true when the job day is blocked. */
export function isDateUnavailable(
  scheduledAt: string,
  blockedDates: Iterable<string>,
): boolean {
  const day = scheduledAt.slice(0, 10);
  for (const blocked of blockedDates) {
    if (blocked === day) return true;
  }
  return false;
}
