export interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  /** Optional override; defaults to RESEND_FROM_EMAIL / EMAIL_FROM / locked mail subdomain. */
  from?: string;
}

export interface SendEmailResult {
  id?: string;
  provider: string;
}

const LOCKED_FROM = "MaidLinx <bookings@mail.maidlinx.com>";

export async function sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
  const provider = process.env.EMAIL_PROVIDER ?? "log";

  if (provider === "log") {
    console.log("[email]", {
      to: params.to,
      subject: params.subject,
      replyTo: params.replyTo,
      text: params.text ?? params.html.replace(/<[^>]+>/g, " "),
    });
    return { provider: "log" };
  }

  if (provider === "resend") {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.warn("[email] RESEND_API_KEY missing — logging instead.");
      console.log("[email]", params);
      return { provider: "log" };
    }

    const from =
      params.from ||
      process.env.RESEND_FROM_EMAIL ||
      process.env.EMAIL_FROM ||
      LOCKED_FROM;

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: params.to,
        subject: params.subject,
        html: params.html,
        text: params.text,
        ...(params.replyTo ? { reply_to: params.replyTo } : {}),
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Resend error (${response.status}): ${body}`);
    }

    const data = (await response.json()) as { id?: string };
    return { provider: "resend", id: data.id };
  }

  console.warn(`[email] Unknown EMAIL_PROVIDER "${provider}" — logging instead.`);
  console.log("[email]", params);
  return { provider: "log" };
}
