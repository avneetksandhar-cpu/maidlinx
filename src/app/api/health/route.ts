import { NextResponse } from "next/server";

export async function GET() {
  const sentry = Boolean(
    process.env.SENTRY_DSN?.trim() || process.env.NEXT_PUBLIC_SENTRY_DSN?.trim(),
  );

  return NextResponse.json(
    {
      status: "ok",
      service: "maidlinx",
      sentry,
      release:
        process.env.SENTRY_RELEASE ||
        process.env.VERCEL_GIT_COMMIT_SHA ||
        null,
      timestamp: new Date().toISOString(),
    },
    { status: 200 },
  );
}
