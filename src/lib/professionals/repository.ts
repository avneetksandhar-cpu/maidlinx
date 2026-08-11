import { createAdminClient, hasAdminEnv } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  parseOnboardingStatus,
  parseStripeConnectStatus,
  type CleanerOnboardingStatus,
  type OnboardingChecklist,
  type StripeConnectStatus,
} from "@/lib/cleaners/onboarding";
import type { UserRole } from "@/types/database.types";

async function getDbClient() {
  if (hasAdminEnv()) {
    return createAdminClient();
  }
  return createClient();
}

export interface ProfessionalProfile {
  id: string;
  clerkUserId: string;
  role: UserRole;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  email: string | null;
  avatarUrl: string | null;
  onboardingComplete: boolean;
  professionalId: string;
  bio: string | null;
  yearsExperience: number | null;
  serviceRadiusKm: number;
  isVerified: boolean;
  isActive: boolean;
  ratingAverage: number;
  ratingCount: number;
  onboardingStatus: CleanerOnboardingStatus;
  onboardingChecklist: OnboardingChecklist;
  isOnline: boolean;
  stripeConnectStatus: StripeConnectStatus;
  marketId: string | null;
  languages: string[];
  transportation: string | null;
}

function mapChecklist(value: unknown): OnboardingChecklist {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as OnboardingChecklist;
}

function mapProfessional(
  profile: Record<string, unknown>,
  professional: Record<string, unknown>,
  email: string | null,
): ProfessionalProfile {
  return {
    id: String(profile.id),
    clerkUserId: String(profile.clerk_user_id),
    role: profile.role as UserRole,
    firstName: profile.first_name ? String(profile.first_name) : null,
    lastName: profile.last_name ? String(profile.last_name) : null,
    phone: profile.phone ? String(profile.phone) : null,
    email,
    avatarUrl: profile.avatar_url ? String(profile.avatar_url) : null,
    onboardingComplete: Boolean(profile.onboarding_complete),
    professionalId: String(professional.id),
    bio: professional.bio ? String(professional.bio) : null,
    yearsExperience: professional.years_experience ? Number(professional.years_experience) : null,
    serviceRadiusKm: Number(professional.service_radius_km ?? 25),
    isVerified: Boolean(professional.is_verified),
    isActive: Boolean(professional.is_active),
    ratingAverage: Number(professional.rating_average ?? 0),
    ratingCount: Number(professional.rating_count ?? 0),
    onboardingStatus: parseOnboardingStatus(professional.onboarding_status),
    onboardingChecklist: mapChecklist(professional.onboarding_checklist),
    isOnline: Boolean(professional.is_online),
    stripeConnectStatus: parseStripeConnectStatus(professional.stripe_connect_status),
    marketId: professional.market_id ? String(professional.market_id) : null,
    languages: Array.isArray(professional.languages)
      ? professional.languages.map(String)
      : [],
    transportation: professional.transportation ? String(professional.transportation) : null,
  };
}

export async function ensureProfessionalProfile(input: {
  authUserId: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
}): Promise<ProfessionalProfile> {
  const supabase = await getDbClient();

  const { data: existingProfile, error: fetchError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", input.authUserId)
    .maybeSingle();

  if (fetchError) throw new Error(fetchError.message);

  if (existingProfile) {
    const role = existingProfile.role;
    if (role !== "cleaner" && role !== "professional" && role !== "admin") {
      throw new Error("Cleaner account required. Sign up at /earn to become a cleaner.");
    }

    const { data: professional, error: proError } = await supabase
      .from("professionals")
      .select("*")
      .eq("profile_id", existingProfile.id)
      .maybeSingle();

    if (proError) throw new Error(proError.message);

    if (professional) {
      return mapProfessional(
        { ...existingProfile, role: "cleaner" },
        professional as Record<string, unknown>,
        input.email,
      );
    }

    const { data: createdPro, error: createProError } = await supabase
      .from("professionals")
      .insert({
        profile_id: existingProfile.id,
        is_active: false,
        is_verified: false,
        onboarding_status: "NOT_STARTED",
        is_online: false,
        stripe_connect_status: "NOT_STARTED",
      })
      .select("*")
      .single();

    if (createProError || !createdPro) {
      throw new Error(createProError?.message ?? "Failed to create professional record.");
    }

    return mapProfessional(
      { ...existingProfile, role: "cleaner" },
      createdPro as Record<string, unknown>,
      input.email,
    );
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .insert({
      id: input.authUserId,
      clerk_user_id: input.authUserId,
      email: input.email,
      role: "cleaner",
      first_name: input.firstName ?? null,
      last_name: input.lastName ?? null,
      phone: input.phone ?? null,
      avatar_url: input.avatarUrl ?? null,
      onboarding_complete: false,
    })
    .select("*")
    .single();

  if (profileError || !profile) {
    throw new Error(profileError?.message ?? "Failed to create profile.");
  }

  const { data: professional, error: proError } = await supabase
    .from("professionals")
    .insert({
      profile_id: profile.id,
      is_active: false,
      is_verified: false,
      onboarding_status: "NOT_STARTED",
      is_online: false,
      stripe_connect_status: "NOT_STARTED",
    })
    .select("*")
    .single();

  if (proError || !professional) {
    throw new Error(proError?.message ?? "Failed to create professional record.");
  }

  if (hasAdminEnv()) {
    await supabase.from("notification_preferences").insert({ profile_id: profile.id });
  }

  return mapProfessional(profile as Record<string, unknown>, professional as Record<string, unknown>, input.email);
}

export async function updateProfessionalProfile(
  profileId: string,
  professionalId: string,
  input: {
    firstName: string;
    lastName: string;
    phone?: string | null;
    bio?: string | null;
    yearsExperience?: number | null;
    serviceRadiusKm?: number;
  },
): Promise<void> {
  const supabase = await getDbClient();

  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      first_name: input.firstName,
      last_name: input.lastName,
      phone: input.phone ?? null,
    })
    .eq("id", profileId);

  if (profileError) throw new Error(profileError.message);

  const { error: proError } = await supabase
    .from("professionals")
    .update({
      bio: input.bio ?? null,
      years_experience: input.yearsExperience ?? null,
      service_radius_km: input.serviceRadiusKm ?? undefined,
    })
    .eq("id", professionalId);

  if (proError) throw new Error(proError.message);
}
