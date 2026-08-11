import { createAdminClient } from "@/lib/supabase/admin";

export interface NotificationPreferences {
  emailBookingUpdates: boolean;
  emailPromotions: boolean;
  smsReminders: boolean;
  pushEnabled: boolean;
}

function mapPrefs(row: Record<string, unknown>): NotificationPreferences {
  return {
    emailBookingUpdates: Boolean(row.email_booking_updates),
    emailPromotions: Boolean(row.email_promotions),
    smsReminders: Boolean(row.sms_reminders),
    pushEnabled: Boolean(row.push_enabled),
  };
}

export async function getNotificationPreferences(
  profileId: string,
): Promise<NotificationPreferences> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("notification_preferences")
    .select("*")
    .eq("profile_id", profileId)
    .maybeSingle();

  if (error) throw new Error(error.message);

  if (!data) {
    const defaults = {
      profile_id: profileId,
      email_booking_updates: true,
      email_promotions: false,
      sms_reminders: true,
      push_enabled: true,
    };
    await supabase.from("notification_preferences").insert(defaults);
    return mapPrefs(defaults);
  }

  return mapPrefs(data as Record<string, unknown>);
}

export async function updateNotificationPreferences(
  profileId: string,
  prefs: NotificationPreferences,
): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase.from("notification_preferences").upsert({
    profile_id: profileId,
    email_booking_updates: prefs.emailBookingUpdates,
    email_promotions: prefs.emailPromotions,
    sms_reminders: prefs.smsReminders,
    push_enabled: prefs.pushEnabled,
  });

  if (error) throw new Error(error.message);
}
