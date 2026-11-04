/**
 * Retention events architecture.
 * Queues thank-you / review / rebook / upcoming / abandoned reminders.
 * Does not spam — skips when providers are unset (default log).
 */

import { createAdminClient, hasAdminEnv } from "@/lib/supabase/admin";

export const RETENTION_EVENT_TYPES = [
  "completed_thank_you",
  "review_request",
  "rebook_nudge",
  "upcoming_reminder",
  "abandoned_booking",
] as const;

export type RetentionEventType = (typeof RETENTION_EVENT_TYPES)[number];

export function getNotificationProviderStatus(): {
  emailConfigured: boolean;
  smsConfigured: boolean;
  message: string;
} {
  const emailConfigured = Boolean(
    process.env.RESEND_API_KEY || process.env.EMAIL_PROVIDER === "resend",
  );
  const smsConfigured = Boolean(
    process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN,
  );

  if (!emailConfigured && !smsConfigured) {
    return {
      emailConfigured: false,
      smsConfigured: false,
      message:
        "Provider setup required: configure RESEND_API_KEY (email) and/or Twilio (SMS). Default provider is log-only.",
    };
  }

  return {
    emailConfigured,
    smsConfigured,
    message: emailConfigured && smsConfigured
      ? "Email and SMS providers configured."
      : emailConfigured
        ? "Email configured; SMS provider setup required for SMS retention."
        : "SMS configured; email provider setup required for email retention.",
  };
}

export async function enqueueRetentionEvent(input: {
  eventType: RetentionEventType;
  bookingId?: string | null;
  profileId?: string | null;
  recipient?: string | null;
  channel?: "email" | "sms" | "push" | "in_app";
  scheduledFor?: Date;
  metadata?: Record<string, unknown>;
}): Promise<{ queued: boolean; skipped: boolean; reason?: string }> {
  const providers = getNotificationProviderStatus();
  const channel = input.channel ?? "email";

  if (channel === "email" && !providers.emailConfigured) {
    return {
      queued: false,
      skipped: true,
      reason: providers.message,
    };
  }
  if (channel === "sms" && !providers.smsConfigured) {
    return {
      queued: false,
      skipped: true,
      reason: providers.message,
    };
  }

  if (!hasAdminEnv()) {
    return { queued: false, skipped: true, reason: "Database not configured." };
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("retention_events").insert({
    event_type: input.eventType,
    booking_id: input.bookingId ?? null,
    profile_id: input.profileId ?? null,
    recipient: input.recipient ?? null,
    channel,
    status: "pending",
    scheduled_for: (input.scheduledFor ?? new Date()).toISOString(),
    metadata: input.metadata ?? {},
  } as never);

  if (error) {
    if (/retention_events|does not exist|schema cache/i.test(error.message)) {
      return {
        queued: false,
        skipped: true,
        reason: "Apply migration 00023 (retention_events).",
      };
    }
    return { queued: false, skipped: true, reason: error.message };
  }

  return { queued: true, skipped: false };
}

/** Documented schedule offsets — no cron runner here. */
export const RETENTION_SCHEDULE = {
  completed_thank_you: { delayHours: 0 },
  review_request: { delayHours: 24 },
  rebook_nudge: { delayDays: 14 },
  upcoming_reminder: { hoursBefore: 24 },
  abandoned_booking: { delayHours: 2 },
} as const;
