import { createAdminClient, hasAdminEnv } from "@/lib/supabase/admin";

export interface AdminReview {
  id: string;
  bookingId: string;
  rating: number;
  comment: string | null;
  reviewerName: string | null;
  revieweeName: string | null;
  createdAt: string;
}

export async function listAdminReviews(limit = 100): Promise<AdminReview[]> {
  if (!hasAdminEnv()) return [];

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("reviews")
    .select(
      `
      id,
      booking_id,
      rating,
      comment,
      created_at,
      reviewer:profiles!reviews_reviewer_id_fkey (first_name, last_name),
      reviewee:profiles!reviews_reviewee_id_fkey (first_name, last_name)
    `,
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    if (error.message.includes("reviews")) return [];
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => {
    const r = row as Record<string, unknown>;
    const reviewer = r.reviewer as Record<string, unknown> | null;
    const reviewee = r.reviewee as Record<string, unknown> | null;
    return {
      id: String(r.id),
      bookingId: String(r.booking_id),
      rating: Number(r.rating),
      comment: r.comment ? String(r.comment) : null,
      reviewerName: reviewer
        ? [reviewer.first_name, reviewer.last_name].filter(Boolean).join(" ") || null
        : null,
      revieweeName: reviewee
        ? [reviewee.first_name, reviewee.last_name].filter(Boolean).join(" ") || null
        : null,
      createdAt: String(r.created_at),
    };
  });
}
