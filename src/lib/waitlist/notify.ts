/**
 * Optional single confirmation email after waitlist join.
 * Uses existing EMAIL_PROVIDER / Resend infra — log mode is fine (no spam, $0).
 * Never throws to callers; signup already succeeded.
 */

import { sendEmail } from "@/lib/notifications/email";

export async function sendWaitlistConfirmationEmail(params: {
  email: string;
  name?: string | null;
  marketId?: string | null;
  alreadyJoined?: boolean;
}): Promise<{ sent: boolean; provider?: string }> {
  const greeting = params.name?.trim() ? `Hi ${params.name.trim()},` : "Hi,";
  const marketLine = params.marketId
    ? ` We have your market down as ${params.marketId.replace(/_/g, " ")}.`
    : "";
  const subject = params.alreadyJoined
    ? "You're already on the MaidLinx waitlist"
    : "You're on the MaidLinx waitlist";
  const text = [
    greeting,
    "",
    params.alreadyJoined
      ? "You're already on the MaidLinx launch waitlist — we'll email you when booking opens in your area."
      : "You're on the MaidLinx launch waitlist. We'll email you when booking opens in your area.",
    marketLine.trim(),
    "",
    "— MaidLinx",
  ]
    .filter(Boolean)
    .join("\n");

  const html = `<p>${greeting}</p><p>${
    params.alreadyJoined
      ? "You're already on the MaidLinx launch waitlist — we'll email you when booking opens in your area."
      : "You're on the MaidLinx launch waitlist. We'll email you when booking opens in your area."
  }${marketLine}</p><p>— MaidLinx</p>`;

  try {
    const result = await sendEmail({
      to: params.email,
      subject,
      html,
      text,
    });
    return { sent: result.provider !== "log", provider: result.provider };
  } catch (err) {
    console.warn(
      "[waitlist] confirmation email failed (signup kept):",
      err instanceof Error ? err.message : err,
    );
    return { sent: false };
  }
}
