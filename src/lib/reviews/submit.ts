/**
 * Customer reviews — only after completed booking; one review per booking.
 */

import { createAdminClient, hasAdminEnv } from "@/lib/supabase/admin";
import { emitBookingEvent } from "@/lib/bookings/events";

export class ReviewAuthzError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ReviewAuthzError";
  }
}

export interface SubmitReviewInput {
  bookingId: string;
  reviewerId: string;
  reviewerEmail: string;
  rating: number;
  comment?: string | null;
}

export async function submitBookingReview(input: SubmitReviewInput): Promise<{ id: string }> {
  if (!hasAdminEnv()) throw new Error("Database is not configured.");
  if (input.rating < 1 || input.rating > 5) {
    throw new ReviewAuthzError("Rating must be between 1 and 5.");
  }

  const supabase = createAdminClient();
  const { data: booking, error } = await supabase
    .from("bookings")
    .select(
      "id, status, customer_id, customer_email, professional_profile_id, professional_id, cleaner_id",
    )
    .eq("id", input.bookingId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!booking) throw new ReviewAuthzError("Booking not found.");

  const row = booking as Record<string, unknown>;
  if (String(row.status) !== "completed") {
    throw new ReviewAuthzError("Reviews are only allowed after the booking is completed.");
  }

  const ownerMatch =
    row.customer_id && String(row.customer_id) === input.reviewerId;
  const emailMatch =
    row.customer_email &&
    String(row.customer_email).toLowerCase() === input.reviewerEmail.toLowerCase();

  if (!ownerMatch && !emailMatch) {
    throw new ReviewAuthzError("You do not have access to review this booking.");
  }

  const revieweeId =
    (row.professional_profile_id ? String(row.professional_profile_id) : null) ??
    (row.professional_id ? String(row.professional_id) : null);

  if (!revieweeId) {
    throw new ReviewAuthzError("No cleaner is assigned to this booking.");
  }

  const { data: existing } = await supabase
    .from("reviews")
    .select("id")
    .eq("booking_id", input.bookingId)
    .maybeSingle();

  if (existing) {
    throw new ReviewAuthzError("A review already exists for this booking.");
  }

  const { data: created, error: insertError } = await supabase
    .from("reviews")
    .insert({
      booking_id: input.bookingId,
      reviewer_id: input.reviewerId,
      reviewee_id: revieweeId,
      rating: input.rating,
      comment: input.comment?.trim() || null,
    })
    .select("id")
    .single();

  if (insertError) {
    if (/unique|duplicate/i.test(insertError.message)) {
      throw new ReviewAuthzError("A review already exists for this booking.");
    }
    throw new Error(insertError.message);
  }

  // Refresh cleaner aggregate rating (best-effort).
  const { data: aggregates } = await supabase
    .from("reviews")
    .select("rating")
    .eq("reviewee_id", revieweeId);

  if (aggregates && aggregates.length > 0) {
    const ratings = aggregates.map((r) => Number((r as { rating: number }).rating));
    const avg = ratings.reduce((a, b) => a + b, 0) / ratings.length;
    await supabase
      .from("cleaners")
      .update({
        rating_average: Math.round(avg * 100) / 100,
        rating_count: ratings.length,
      })
      .eq("user_id", revieweeId);
  }

  await emitBookingEvent({
    bookingId: input.bookingId,
    type: "review_submitted",
    actor: { id: input.reviewerId, role: "customer" },
    metadata: { rating: input.rating },
  });

  return { id: String(created.id) };
}

export async function getBookingReviewForCustomer(input: {
  bookingId: string;
  reviewerId: string;
  reviewerEmail: string;
}): Promise<{ id: string; rating: number; comment: string | null } | null> {
  if (!hasAdminEnv()) throw new Error("Database is not configured.");

  const supabase = createAdminClient();
  const { data: booking, error } = await supabase
    .from("bookings")
    .select("id, customer_id, customer_email")
    .eq("id", input.bookingId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!booking) throw new ReviewAuthzError("Booking not found.");

  const row = booking as Record<string, unknown>;
  const ownerMatch = row.customer_id && String(row.customer_id) === input.reviewerId;
  const emailMatch =
    row.customer_email &&
    String(row.customer_email).toLowerCase() === input.reviewerEmail.toLowerCase();
  if (!ownerMatch && !emailMatch) {
    throw new ReviewAuthzError("You do not have access to this booking.");
  }

  const { data: review, error: reviewError } = await supabase
    .from("reviews")
    .select("id, rating, comment")
    .eq("booking_id", input.bookingId)
    .maybeSingle();

  if (reviewError) throw new Error(reviewError.message);
  if (!review) return null;

  return {
    id: String(review.id),
    rating: Number(review.rating),
    comment: review.comment ? String(review.comment) : null,
  };
}

/** Pure authz helper for tests. */
export function canSubmitReview(input: {
  bookingStatus: string;
  bookingCustomerId: string | null;
  bookingCustomerEmail: string | null;
  reviewerId: string;
  reviewerEmail: string;
  hasExistingReview: boolean;
  hasAssignedCleaner: boolean;
}): { ok: true } | { ok: false; error: string } {
  if (input.bookingStatus !== "completed") {
    return { ok: false, error: "Reviews are only allowed after the booking is completed." };
  }
  if (input.hasExistingReview) {
    return { ok: false, error: "A review already exists for this booking." };
  }
  if (!input.hasAssignedCleaner) {
    return { ok: false, error: "No cleaner is assigned to this booking." };
  }
  const owner =
    input.bookingCustomerId === input.reviewerId ||
    (input.bookingCustomerEmail &&
      input.bookingCustomerEmail.toLowerCase() === input.reviewerEmail.toLowerCase());
  if (!owner) {
    return { ok: false, error: "You do not have access to review this booking." };
  }
  return { ok: true };
}
