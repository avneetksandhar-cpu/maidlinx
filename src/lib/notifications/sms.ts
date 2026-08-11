export interface SendSmsParams {
  to: string;
  body: string;
}

export async function sendSms(params: SendSmsParams): Promise<void> {
  const provider = process.env.SMS_PROVIDER ?? "log";

  if (provider === "log") {
    console.log("[sms]", params);
    return;
  }

  if (provider === "twilio") {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const from = process.env.TWILIO_FROM;

    if (!accountSid || !authToken || !from) {
      console.warn("[sms] Twilio env vars missing — logging instead.");
      console.log("[sms]", params);
      return;
    }

    const credentials = Buffer.from(`${accountSid}:${authToken}`).toString("base64");
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${credentials}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          To: params.to,
          From: from,
          Body: params.body,
        }),
      },
    );

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Twilio error (${response.status}): ${body}`);
    }

    return;
  }

  console.warn(`[sms] Unknown SMS_PROVIDER "${provider}" — logging instead.`);
  console.log("[sms]", params);
}
