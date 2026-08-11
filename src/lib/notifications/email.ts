export interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(params: SendEmailParams): Promise<void> {
  const provider = process.env.EMAIL_PROVIDER ?? "log";

  if (provider === "log") {
    console.log("[email]", {
      to: params.to,
      subject: params.subject,
      text: params.text ?? params.html.replace(/<[^>]+>/g, " "),
    });
    return;
  }

  if (provider === "resend") {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.warn("[email] RESEND_API_KEY missing — logging instead.");
      console.log("[email]", params);
      return;
    }

    const from = process.env.EMAIL_FROM ?? "MaidLinx <bookings@maidlinx.com>";
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
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Resend error (${response.status}): ${body}`);
    }

    return;
  }

  console.warn(`[email] Unknown EMAIL_PROVIDER "${provider}" — logging instead.`);
  console.log("[email]", params);
}
