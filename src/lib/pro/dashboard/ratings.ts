import { createAdminClient } from "@/lib/supabase/admin";

export interface ProRating {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  reviewerName: string;
  serviceType: string | null;
}

export interface RatingsSummary {
  average: number;
  count: number;
}

export async function getRatingsSummary(profileId: string): Promise<RatingsSummary> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("professionals")
    .select("rating_average, rating_count")
    .eq("profile_id", profileId)
    .maybeSingle();

  if (error) throw new Error(error.message);

  return {
    average: Number(data?.rating_average ?? 0),
    count: Number(data?.rating_count ?? 0),
  };
}

export async function getProfessionalRatings(profileId: string): Promise<ProRating[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("reviews")
    .select(
      `
      id,
      rating,
      comment,
      created_at,
      reviewer:profiles!reviews_reviewer_id_fkey (first_name, last_name),
      booking:bookings (service_type)
    `,
    )
    .eq("reviewee_id", profileId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    if (error.message.includes("reviews")) return [];
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => {
    const record = row as Record<string, unknown>;
    const reviewer = record.reviewer as Record<string, unknown> | null;
    const booking = record.booking as Record<string, unknown> | null;

    return {
      id: String(record.id),
      rating: Number(record.rating),
      comment: record.comment ? String(record.comment) : null,
      createdAt: String(record.created_at),
      reviewerName:
        [reviewer?.first_name, reviewer?.last_name].filter(Boolean).join(" ") || "Customer",
      serviceType: booking?.service_type ? String(booking.service_type) : null,
    };
  });
}
