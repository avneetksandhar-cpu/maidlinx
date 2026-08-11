import { jsonError, jsonSuccess } from "@/lib/api/response";
import { checkRateLimit, clientIpFromRequest } from "@/lib/api/rate-limit";
import { requireCustomerSession } from "@/lib/dashboard/session";
import { ReviewAuthzError, submitBookingReview } from "@/lib/reviews/submit";
import { z } from "zod";

const submitReviewSchema = z.object({
  bookingId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().max(2000).optional(),
});

export async function POST(request: Request) {
  const ip = clientIpFromRequest(request);
  const limit = checkRateLimit(`review:create:${ip}`, 10, 60_000);
  if (!limit.allowed) {
    return jsonError("Too many review attempts.", 429, "RATE_LIMITED");
  }

  try {
    const { profile, email } = await requireCustomerSession();
    const body = await request.json();
    const parsed = submitReviewSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(parsed.error.errors[0]?.message ?? "Invalid review.", 400);
    }

    const review = await submitBookingReview({
      bookingId: parsed.data.bookingId,
      reviewerId: profile.id,
      reviewerEmail: email,
      rating: parsed.data.rating,
      comment: parsed.data.comment,
    });

    return jsonSuccess({ review }, 201);
  } catch (error) {
    if (error instanceof ReviewAuthzError) {
      return jsonError(error.message, 403, "REVIEW_FORBIDDEN");
    }
    const message = error instanceof Error ? error.message : "Unable to submit review.";
    const status = message.includes("Authentication") ? 401 : 400;
    return jsonError(message, status);
  }
}
