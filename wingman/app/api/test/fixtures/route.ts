import { NextResponse } from "next/server";
import { isResponse, jsonError, requireSession } from "@/lib/api/http";
import { canUsePrivateTestBooking, loadTestFixtureSnapshot } from "@/lib/marketplace/test-booking";
import { readStripeEnv } from "@/lib/payments/env";
import { testFixturesEnabled } from "@/lib/test-fixtures/env";

export const runtime = "nodejs";

export async function GET() {
  const user = await requireSession();
  if (isResponse(user)) return user;
  if (!testFixturesEnabled()) {
    return jsonError(
      "Private TEST fixtures are disabled. Set ENABLE_TEST_FIXTURES=true for admin/test mode only.",
      404,
    );
  }
  const snapshot = await loadTestFixtureSnapshot();
  if (!canUsePrivateTestBooking(user, snapshot.customerEmail)) {
    return jsonError("Private TEST booking is limited to the TEST customer and operators.", 403);
  }
  const stripe = readStripeEnv();
  return NextResponse.json({
    ...snapshot,
    stripeConfigured: stripe.ok,
    stripeBlocker: stripe.ok
      ? null
      : "Stripe test keys are missing. Payment cannot succeed until pk_test_ / sk_test_ / whsec_ are in .env.local.",
    publicNote: "These fixtures are not listed on /wingmen or /events.",
  });
}
