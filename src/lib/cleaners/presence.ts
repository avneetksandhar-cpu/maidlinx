import { createAdminClient } from "@/lib/supabase/admin";
import {
  canReceiveJobOffers,
  parseOnboardingStatus,
  type CleanerOnboardingStatus,
} from "@/lib/cleaners/onboarding";

export async function setCleanerOnlineStatus(
  professionalId: string,
  isOnline: boolean,
): Promise<{ isOnline: boolean; onboardingStatus: CleanerOnboardingStatus }> {
  const supabase = createAdminClient();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("professionals")
    .update({
      is_online: isOnline,
      last_online_at: isOnline ? now : null,
    })
    .eq("id", professionalId)
    .select("is_online, onboarding_status")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Unable to update online status.");
  }

  return {
    isOnline: Boolean(data.is_online),
    onboardingStatus: parseOnboardingStatus(data.onboarding_status),
  };
}

export function assertCanGoOnline(status: CleanerOnboardingStatus): void {
  if (status !== "APPROVED") {
    throw new Error("Go online after MaidLinx ops approves your application.");
  }
}

export function isOfferEligible(status: CleanerOnboardingStatus, isOnline: boolean): boolean {
  return canReceiveJobOffers(status, isOnline);
}
