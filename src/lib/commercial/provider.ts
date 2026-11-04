import type { CommercialProviderProfile } from "@/lib/commercial/types";
import { createAdminClient, hasAdminEnv } from "@/lib/supabase/admin";

export async function getCommercialProviderProfile(
  cleanerId: string,
): Promise<CommercialProviderProfile | null> {
  if (!hasAdminEnv()) return null;
  const supabase = createAdminClient();

  const { data: cleaner } = await supabase
    .from("cleaners")
    .select("id, is_verified, is_active, approved")
    .eq("id", cleanerId)
    .maybeSingle();
  if (!cleaner) return null;
  const c = cleaner as Record<string, unknown>;

  const { data: profile } = await supabase
    .from("commercial_provider_profiles" as never)
    .select("*")
    .eq("cleaner_id", cleanerId)
    .maybeSingle();

  if (!profile) {
    return {
      cleanerId,
      serviceArea: null,
      specialties: [],
      availableHours: null,
      onboardingComplete: false,
      isVerified: Boolean(c.is_verified) || Boolean(c.approved),
      isActive: Boolean(c.is_active),
    };
  }

  const p = profile as Record<string, unknown>;
  return {
    cleanerId,
    serviceArea: p.service_area ? String(p.service_area) : null,
    specialties: Array.isArray(p.specialties) ? (p.specialties as string[]) : [],
    availableHours: p.available_hours ? String(p.available_hours) : null,
    onboardingComplete: Boolean(p.onboarding_complete),
    isVerified: Boolean(c.is_verified) || Boolean(c.approved),
    isActive: Boolean(c.is_active),
  };
}

export async function upsertCommercialProviderProfile(input: {
  cleanerId: string;
  serviceArea: string;
  specialties: string[];
  availableHours: string;
  markComplete?: boolean;
}): Promise<CommercialProviderProfile> {
  if (!hasAdminEnv()) throw new Error("Database not configured.");
  const supabase = createAdminClient();

  const onboardingComplete =
    Boolean(input.markComplete) ||
    Boolean(
      input.serviceArea.trim() &&
        input.specialties.length > 0 &&
        input.availableHours.trim(),
    );

  const { error } = await supabase.from("commercial_provider_profiles" as never).upsert(
    {
      cleaner_id: input.cleanerId,
      service_area: input.serviceArea.trim(),
      specialties: input.specialties,
      available_hours: input.availableHours.trim(),
      onboarding_complete: onboardingComplete,
      updated_at: new Date().toISOString(),
    } as never,
    { onConflict: "cleaner_id" },
  );
  if (error) throw new Error(error.message);

  const profile = await getCommercialProviderProfile(input.cleanerId);
  if (!profile) throw new Error("Unable to load provider profile.");
  return profile;
}

export async function listProviderServiceOrders(cleanerId: string) {
  if (!hasAdminEnv()) return [];
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("service_orders" as never)
    .select("*")
    .eq("provider_cleaner_id", cleanerId)
    .order("updated_at", { ascending: false });
  if (error) {
    if (/service_orders|does not exist|schema cache/i.test(error.message)) return [];
    throw new Error(error.message);
  }
  return data ?? [];
}
