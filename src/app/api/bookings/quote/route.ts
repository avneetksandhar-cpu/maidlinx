import { createAuthoritativeQuote } from "@/lib/pricing/quotes";
import { PromoValidationError } from "@/lib/pricing/promos";
import {
  assignExperimentVariant,
  loadRunningExperiments,
} from "@/lib/pricing/experiments";
import { jsonError, jsonSuccess } from "@/lib/api/response";
import { checkRateLimit, clientIpFromRequest } from "@/lib/api/rate-limit";
import { bookingQuoteSchema } from "@/lib/validations/booking-flow";
import { z } from "zod";

const quoteRequestSchema = bookingQuoteSchema.extend({
  anonymousSessionId: z.string().trim().min(8).max(128).optional(),
  recurringFrequency: z.enum(["one_time", "weekly", "biweekly", "monthly"]).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  arrivalWindow: z.enum(["morning", "afternoon", "evening"]).optional(),
});

function isOutOfServiceArea(error: unknown): boolean {
  return error instanceof Error && /not in a MaidLinx service area|outside MaidLinx/i.test(error.message);
}

export async function POST(request: Request) {
  const ip = clientIpFromRequest(request);
  const limit = checkRateLimit(`booking:quote:${ip}`, 60, 60_000);
  if (!limit.allowed) {
    return jsonError("Too many quote requests. Try again shortly.", 429, "RATE_LIMITED");
  }

  try {
    const body = await request.json();
    const parsed = quoteRequestSchema.safeParse(body);

    if (!parsed.success) {
      return jsonError(parsed.error.errors[0]?.message ?? "Invalid quote request.", 400);
    }

    let experimentId: string | null = null;
    let experimentVariant: string | null = null;

    if (parsed.data.anonymousSessionId) {
      const experiments = await loadRunningExperiments();
      const primary = experiments[0];
      if (primary) {
        const assignment = await assignExperimentVariant({
          experiment: primary,
          anonymousSessionId: parsed.data.anonymousSessionId,
        });
        experimentId = assignment.experimentId;
        experimentVariant = assignment.variantId;
      }
    }

    const pricing = await createAuthoritativeQuote({
      ...parsed.data,
      experimentId,
      experimentVariant,
    });

    // Public response only — never include calculation_audit / cost formulas.
    return jsonSuccess({
      pricing: {
        baseCents: pricing.baseCents,
        bedroomCents: pricing.bedroomCents,
        bathroomCents: pricing.bathroomCents,
        squareFootageCents: pricing.squareFootageCents,
        extrasCents: pricing.extrasCents,
        subtotalCents: pricing.subtotalCents,
        platformFeeCents: pricing.platformFeeCents,
        feesCents: pricing.feesCents,
        taxCents: pricing.taxCents,
        discountCents: pricing.discountCents,
        totalCents: pricing.totalCents,
        currency: pricing.currency,
        quoteOnly: pricing.quoteOnly,
        pricingModel: pricing.pricingModel,
        serviceLabel: pricing.serviceLabel,
        estimatedDurationMinutes: pricing.estimatedDurationMinutes,
        quoteId: pricing.quoteId,
        quoteToken: pricing.quoteToken,
        expiresAt: pricing.expiresAt,
        couponCode: pricing.couponCode ?? null,
      },
      quoteId: pricing.quoteId,
      expiresAt: pricing.expiresAt,
      experimentVariant: experimentVariant
        ? { experimentId, variantId: experimentVariant }
        : null,
    });
  } catch (error) {
    if (error instanceof PromoValidationError) {
      return jsonError(error.message, 400, "PROMO_INVALID");
    }
    if (isOutOfServiceArea(error)) {
      return jsonError(
        error instanceof Error ? error.message : "This address is not in a MaidLinx service area.",
        422,
        "OUT_OF_SERVICE_AREA",
      );
    }
    return jsonError(
      error instanceof Error ? error.message : "Unable to calculate quote.",
      500,
    );
  }
}
