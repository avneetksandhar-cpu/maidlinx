import { createAdminClient } from "@/lib/supabase/admin";

export interface FavoriteCleaner {
  id: string;
  professionalProfileId: string;
  name: string;
  ratingAverage: number;
  ratingCount: number;
  isVerified: boolean;
  createdAt: string;
}

export async function getFavoriteCleaners(customerProfileId: string): Promise<FavoriteCleaner[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("customer_favorite_cleaners")
    .select(
      `
      id,
      created_at,
      professional_profile_id,
      professional:profiles!customer_favorite_cleaners_professional_profile_id_fkey (
        first_name,
        last_name,
        professionals (
          rating_average,
          rating_count,
          is_verified
        )
      )
    `,
    )
    .eq("customer_profile_id", customerProfileId)
    .order("created_at", { ascending: false });

  if (error) {
    if (error.message.includes("customer_favorite_cleaners")) return [];
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => {
    const record = row as Record<string, unknown>;
    const professional = record.professional as Record<string, unknown> | null;
    const proMeta = Array.isArray(professional?.professionals)
      ? (professional.professionals[0] as Record<string, unknown>)
      : (professional?.professionals as Record<string, unknown> | undefined);

    return {
      id: String(record.id),
      professionalProfileId: String(record.professional_profile_id),
      name: [professional?.first_name, professional?.last_name].filter(Boolean).join(" ") || "Pro",
      ratingAverage: Number(proMeta?.rating_average ?? 0),
      ratingCount: Number(proMeta?.rating_count ?? 0),
      isVerified: Boolean(proMeta?.is_verified),
      createdAt: String(record.created_at),
    };
  });
}

export async function addFavoriteCleaner(
  customerProfileId: string,
  professionalProfileId: string,
): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase.from("customer_favorite_cleaners").upsert(
    {
      customer_profile_id: customerProfileId,
      professional_profile_id: professionalProfileId,
    },
    { onConflict: "customer_profile_id,professional_profile_id" },
  );

  if (error) throw new Error(error.message);
}

export async function removeFavoriteCleaner(
  customerProfileId: string,
  professionalProfileId: string,
): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("customer_favorite_cleaners")
    .delete()
    .eq("customer_profile_id", customerProfileId)
    .eq("professional_profile_id", professionalProfileId);

  if (error) throw new Error(error.message);
}
