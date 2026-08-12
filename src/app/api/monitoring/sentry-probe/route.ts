import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";
import { captureMessage } from "@/lib/monitoring/sentry";

/**
 * Temporary Launch Gate probe — gated by current deploy SHA (not a long-lived secret).
 * Remove after Production verification (must 404).
 */
export async function POST(request: Request) {
  const release =
    process.env.VERCEL_GIT_COMMIT_SHA?.trim() ||
    process.env.SENTRY_RELEASE?.trim() ||
    "";
  if (!release) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  let provided = "";
  try {
    const body = (await request.json()) as { release?: string };
    provided = body.release?.trim() ?? "";
  } catch {
    provided = "";
  }

  if (!provided || provided !== release) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  captureMessage("MAIDLINX_LAUNCH_GATE_SENTRY_PROBE", {
    probe: true,
    source: "sentry-probe",
  });

  await Sentry.flush(5000);

  return NextResponse.json({
    ok: true,
    release,
  });
}
