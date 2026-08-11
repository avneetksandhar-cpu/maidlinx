/**
 * Durable notification queue.
 * When EMAIL_PROVIDER/SMS_PROVIDER is `log` (default), messages stay queued/skipped
 * after console log — never fake a successful third-party send.
 */

import { createAdminClient, hasAdminEnv } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/notifications/email";
import { sendSms } from "@/lib/notifications/sms";
import type { Json } from "@/types/database.types";

export type NotificationChannel = "email" | "sms" | "push" | "in_app";

export interface EnqueueNotificationInput {
  channel: NotificationChannel;
  recipient: string;
  subject?: string | null;
  body: string;
  templateKey?: string | null;
  bookingId?: string | null;
  profileId?: string | null;
  metadata?: Record<string, unknown>;
  /** When true, attempt delivery immediately after enqueue. */
  processNow?: boolean;
}

export async function enqueueNotification(input: EnqueueNotificationInput): Promise<string | null> {
  if (!hasAdminEnv()) {
    // No DB — fall through to direct provider (may be log).
    if (input.channel === "email") {
      await sendEmail({
        to: input.recipient,
        subject: input.subject ?? "MaidLinx",
        html: input.body,
        text: input.body,
      });
    } else if (input.channel === "sms") {
      await sendSms({ to: input.recipient, body: input.body });
    }
    return null;
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("notification_outbox")
    .insert({
      channel: input.channel,
      recipient: input.recipient,
      subject: input.subject ?? null,
      body: input.body,
      template_key: input.templateKey ?? null,
      booking_id: input.bookingId ?? null,
      profile_id: input.profileId ?? null,
      status: "pending",
      metadata: (input.metadata ?? {}) as Json,
    })
    .select("id")
    .single();

  if (error) {
    if (/notification_outbox|does not exist|schema cache/i.test(error.message)) {
      // Migration not applied — deliver via provider abstraction without claiming success falsely.
      if (input.channel === "email") {
        await sendEmail({
          to: input.recipient,
          subject: input.subject ?? "MaidLinx",
          html: input.body,
          text: input.body,
        });
      } else if (input.channel === "sms") {
        await sendSms({ to: input.recipient, body: input.body });
      }
      return null;
    }
    throw new Error(error.message);
  }

  const id = String(data.id);
  if (input.processNow !== false) {
    await processOutboxItem(id);
  }
  return id;
}

export async function processOutboxItem(id: string): Promise<void> {
  if (!hasAdminEnv()) return;
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("notification_outbox")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return;

  const row = data as Record<string, unknown>;
  if (String(row.status) === "sent" || String(row.status) === "skipped") return;

  await supabase
    .from("notification_outbox")
    .update({
      status: "processing",
      attempts: Number(row.attempts ?? 0) + 1,
    })
    .eq("id", id);

  const channel = String(row.channel);
  const emailProvider = (process.env.EMAIL_PROVIDER ?? "log").toLowerCase();
  const smsProvider = (process.env.SMS_PROVIDER ?? "log").toLowerCase();

  try {
    if (channel === "email") {
      await sendEmail({
        to: String(row.recipient),
        subject: row.subject ? String(row.subject) : "MaidLinx",
        html: String(row.body),
        text: String(row.body),
      });
      const status = emailProvider === "log" ? "skipped" : "sent";
      await supabase
        .from("notification_outbox")
        .update({
          status,
          provider: emailProvider,
          sent_at: status === "sent" ? new Date().toISOString() : null,
          last_error:
            status === "skipped"
              ? "EMAIL_PROVIDER=log — queued/logged, not delivered to a real mailbox."
              : null,
        })
        .eq("id", id);
      return;
    }

    if (channel === "sms") {
      await sendSms({ to: String(row.recipient), body: String(row.body) });
      const status = smsProvider === "log" ? "skipped" : "sent";
      await supabase
        .from("notification_outbox")
        .update({
          status,
          provider: smsProvider,
          sent_at: status === "sent" ? new Date().toISOString() : null,
          last_error:
            status === "skipped"
              ? "SMS_PROVIDER=log — queued/logged, not delivered via Twilio."
              : null,
        })
        .eq("id", id);
      return;
    }

    // push / in_app not wired — leave skipped honestly.
    await supabase
      .from("notification_outbox")
      .update({
        status: "skipped",
        last_error: `Channel "${channel}" has no production provider wired.`,
      })
      .eq("id", id);
  } catch (err) {
    await supabase
      .from("notification_outbox")
      .update({
        status: "failed",
        last_error: err instanceof Error ? err.message : "Delivery failed",
      })
      .eq("id", id);
  }
}
