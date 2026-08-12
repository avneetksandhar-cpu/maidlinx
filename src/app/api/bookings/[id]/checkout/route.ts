import { BookingAccessError, assertBookingAccess } from "@/lib/bookings/access";
import {
  getBookingById,
  attachPaymentIntent,
  recordLegalConsent,
} from "@/lib/bookings/repository";
import { jsonError, jsonSuccess } from "@/lib/api/response";
import { checkRateLimit, clientIpFromRequest } from "@/lib/api/rate-limit";
import {
  LEGAL_CONSENT_POLICY_VERSION,
  isValidLegalConsent,
} from "@/lib/legal/consent";
import { calculateDepositCents, getDepositPercent } from "@/lib/payments/deposit";
import { getStripeServer } from "@/lib/stripe/server";

interface RouteContext {
  params: Promise<{ id: string }>;
}

const REUSABLE_PI_STATUSES = new Set([
  "requires_payment_method",
  "requires_confirmation",
  "requires_action",
]);

export async function POST(request: Request, context: RouteContext) {
  const ip = clientIpFromRequest(request);
  const limit = checkRateLimit(`booking:checkout:${ip}`, 30, 60_000);
  if (!limit.allowed) {
    return jsonError("Too many checkout attempts.", 429, "RATE_LIMITED");
  }

  try {
    const { id } = await context.params;
    const booking = await getBookingById(id);

    if (!booking) {
      return jsonError("Booking not found.", 404);
    }

    const headerToken = request.headers.get("x-booking-access-token");
    let bodyToken: string | null = null;
    let legalConsentAccepted: unknown = undefined;
    let legalConsentPolicyVersion: unknown = undefined;
    try {
      const body = (await request.json()) as {
        accessToken?: string;
        legalConsentAccepted?: unknown;
        legalConsentPolicyVersion?: unknown;
      };
      bodyToken = body.accessToken ?? null;
      legalConsentAccepted = body.legalConsentAccepted;
      legalConsentPolicyVersion = body.legalConsentPolicyVersion;
    } catch {
      bodyToken = null;
    }

    if (
      !isValidLegalConsent({
        legalConsentAccepted,
        legalConsentPolicyVersion,
      })
    ) {
      return jsonError(
        "You must accept the Terms of Service and Privacy Policy before payment.",
        400,
        "LEGAL_CONSENT_REQUIRED",
      );
    }

    const accessToken = headerToken ?? bodyToken;

    await assertBookingAccess(booking, accessToken);

    if (booking.status !== "pending_payment") {
      return jsonError("Booking payment has already been started or completed.", 400);
    }

    if (!booking.pricing_snapshot || booking.pricing_snapshot.totalCents !== booking.total_cents) {
      return jsonError("Stored pricing is invalid. Contact support.", 400);
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      console.error("[checkout] STRIPE_SECRET_KEY missing");
      return jsonError("Payment is temporarily unavailable. Please try again shortly.", 503);
    }

    await recordLegalConsent(booking.id, LEGAL_CONSENT_POLICY_VERSION);

    const depositPercent = getDepositPercent();
    const depositCents = calculateDepositCents(booking.total_cents);
    const paymentType = depositCents >= booking.total_cents ? "full" : "deposit";
    const stripe = getStripeServer();

    // Reuse an open PaymentIntent to prevent duplicate charge attempts.
    if (booking.stripe_payment_intent_id && !booking.stripe_payment_intent_id.startsWith("dev_test_")) {
      try {
        const existing = await stripe.paymentIntents.retrieve(booking.stripe_payment_intent_id);
        if (
          existing.client_secret &&
          REUSABLE_PI_STATUSES.has(existing.status) &&
          existing.amount === depositCents &&
          existing.currency === booking.currency.toLowerCase()
        ) {
          return jsonSuccess({
            clientSecret: existing.client_secret,
            paymentIntentId: existing.id,
            amountCents: depositCents,
            depositCents,
            totalCents: booking.total_cents,
            depositPercent,
            paymentType,
            reused: true,
            legalConsentPolicyVersion: LEGAL_CONSENT_POLICY_VERSION,
          });
        }
        if (existing.status === "succeeded") {
          return jsonError(
            "Payment already succeeded. Refresh to confirm your booking.",
            400,
            "PAYMENT_ALREADY_SUCCEEDED",
          );
        }
      } catch {
        // Create a fresh PI if the stored one is missing/invalid.
      }
    }

    const paymentIntent = await stripe.paymentIntents.create(
      {
        amount: depositCents,
        currency: booking.currency.toLowerCase(),
        automatic_payment_methods: { enabled: true },
        metadata: {
          bookingId: booking.id,
          paymentType,
          depositPercent: String(depositPercent),
          totalCents: String(booking.total_cents),
          legalConsentPolicyVersion: LEGAL_CONSENT_POLICY_VERSION,
        },
        receipt_email: booking.customer_email ?? undefined,
        description: `MaidLinx ${booking.service_type} cleaning ${paymentType}`,
      },
      {
        // Stripe idempotency — same booking + deposit amount won't create duplicate PIs.
        idempotencyKey: `maidlinx_checkout_${booking.id}_${depositCents}`,
      },
    );

    if (!paymentIntent.client_secret) {
      return jsonError("Unable to initialize payment.", 500);
    }

    await attachPaymentIntent(booking.id, paymentIntent.id);

    return jsonSuccess({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amountCents: depositCents,
      depositCents,
      totalCents: booking.total_cents,
      depositPercent,
      paymentType,
      reused: false,
      legalConsentPolicyVersion: LEGAL_CONSENT_POLICY_VERSION,
    });
  } catch (error) {
    if (error instanceof BookingAccessError) {
      return jsonError(error.message, 403);
    }
    const message = error instanceof Error ? error.message : "Unable to start checkout.";
    return jsonError(message, 400);
  }
}
