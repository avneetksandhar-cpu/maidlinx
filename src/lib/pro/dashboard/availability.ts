import { createAdminClient } from "@/lib/supabase/admin";
import { ARRIVAL_WINDOWS } from "@/lib/bookings/constants";

export type ArrivalWindowId = (typeof ARRIVAL_WINDOWS)[number]["id"];

export interface AvailabilitySlot {
  dayOfWeek: number;
  arrivalWindow: ArrivalWindowId;
  isAvailable: boolean;
}

export function defaultAvailability(): AvailabilitySlot[] {
  const slots: AvailabilitySlot[] = [];
  for (let day = 0; day < 7; day += 1) {
    for (const window of ARRIVAL_WINDOWS) {
      slots.push({
        dayOfWeek: day,
        arrivalWindow: window.id,
        isAvailable: day >= 1 && day <= 5,
      });
    }
  }
  return slots;
}

export async function getAvailability(profileId: string): Promise<AvailabilitySlot[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("professional_availability")
    .select("*")
    .eq("professional_profile_id", profileId);

  if (error) {
    if (error.message.includes("professional_availability")) return defaultAvailability();
    throw new Error(error.message);
  }

  if (!data || data.length === 0) return defaultAvailability();

  return data.map((row) => {
    const record = row as Record<string, unknown>;
    return {
      dayOfWeek: Number(record.day_of_week),
      arrivalWindow: record.arrival_window as ArrivalWindowId,
      isAvailable: Boolean(record.is_available),
    };
  });
}

export async function updateAvailability(
  profileId: string,
  slots: AvailabilitySlot[],
): Promise<void> {
  const supabase = createAdminClient();

  const { error: deleteError } = await supabase
    .from("professional_availability")
    .delete()
    .eq("professional_profile_id", profileId);

  if (deleteError) throw new Error(deleteError.message);

  const rows = slots.map((slot) => ({
    professional_profile_id: profileId,
    day_of_week: slot.dayOfWeek,
    arrival_window: slot.arrivalWindow,
    is_available: slot.isAvailable,
  }));

  const { error } = await supabase.from("professional_availability").insert(rows);
  if (error) throw new Error(error.message);
}
