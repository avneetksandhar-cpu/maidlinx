import { NextResponse } from "next/server";

export const runtime = "nodejs";

const COPY = {
  apple: "Apple sign-in is not turned on yet.",
  google: "Google sign-in is not turned on yet.",
  facebook: "Facebook sign-in is not turned on yet.",
  linkedin: "LinkedIn sign-in is not turned on yet.",
} as const;

function isProvider(value: string): value is keyof typeof COPY {
  return value in COPY;
}

export async function POST(_request: Request, context: { params: Promise<{ provider: string }> }) {
  const { provider } = await context.params;
  if (!isProvider(provider)) {
    return NextResponse.json({ error: "That sign-in is not available." }, { status: 404 });
  }
  if (provider === "facebook" || provider === "linkedin") {
    return NextResponse.json({ error: COPY[provider] }, { status: 503 });
  }

  const clientId = provider === "apple" ? process.env.APPLE_CLIENT_ID : process.env.GOOGLE_CLIENT_ID;
  const clientSecret = provider === "apple" ? process.env.APPLE_CLIENT_SECRET : process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return NextResponse.json({ error: COPY[provider] }, { status: 503 });
  }

  return NextResponse.json({
    error: `${COPY[provider].replace(" is not turned on yet.", "")} needs the return address configured before it can sign anyone in.`,
  }, { status: 503 });
}
