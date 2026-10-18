import { NextResponse } from "next/server";
import { readStripeEnv } from "@/lib/payments/env";

export const runtime = "nodejs";

export async function GET() {
  const env = readStripeEnv();
  if (!env.ok) {
    return NextResponse.json({
      configured: false,
      mode: null,
      error: env.error,
      blocker:
        "Stripe test keys are not configured. Add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY (pk_test_), STRIPE_SECRET_KEY (sk_test_ or rk_test_), and STRIPE_WEBHOOK_SECRET (whsec_) to .env.local. Live keys are rejected. Payment has not succeeded.",
    });
  }
  return NextResponse.json({
    configured: true,
    mode: env.value.mode,
    publishablePrefix: env.value.publishableKey.slice(0, 7),
  });
}
