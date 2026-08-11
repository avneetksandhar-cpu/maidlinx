import { createAdminClient } from "@/lib/supabase/admin";
import {
  nextOnboardingStatusAfterStep,
  parseOnboardingStatus,
  parseStripeConnectStatus,
  statusAfterAdminReview,
  statusAfterSubmit,
  type CleanerOnboardingStatus,
  type OnboardingChecklist,
  type OnboardingStepId,
  type StripeConnectStatus,
} from "@/lib/cleaners/onboarding";
import type { Json } from "@/types/database.types";

export interface CleanerOnboardingRecord {
  professionalId: string;
  onboardingStatus: CleanerOnboardingStatus;
  checklist: OnboardingChecklist;
  isOnline: boolean;
  stripeConnectStatus: StripeConnectStatus;
  stripeConnectId: string | null;
  marketId: string | null;
  languages: string[];
  transportation: string | null;
  agreementsAcceptedAt: string | null;
  onboardingSubmittedAt: string | null;
  rejectionReason: string | null;
}

function mapChecklist(value: unknown): OnboardingChecklist {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as OnboardingChecklist;
}

function mapRow(data: Record<string, unknown>): CleanerOnboardingRecord {
  return {
    professionalId: String(data.id),
    onboardingStatus: parseOnboardingStatus(data.onboarding_status),
    checklist: mapChecklist(data.onboarding_checklist),
    isOnline: Boolean(data.is_online),
    stripeConnectStatus: parseStripeConnectStatus(data.stripe_connect_status),
    stripeConnectId: data.stripe_connect_id ? String(data.stripe_connect_id) : null,
    marketId: data.market_id ? String(data.market_id) : null,
    languages: Array.isArray(data.languages) ? data.languages.map(String) : [],
    transportation: data.transportation ? String(data.transportation) : null,
    agreementsAcceptedAt: data.agreements_accepted_at
      ? String(data.agreements_accepted_at)
      : null,
    onboardingSubmittedAt: data.onboarding_submitted_at
      ? String(data.onboarding_submitted_at)
      : null,
    rejectionReason: data.rejection_reason ? String(data.rejection_reason) : null,
  };
}

const ONBOARDING_SELECT =
  "id, onboarding_status, onboarding_checklist, is_online, stripe_connect_status, stripe_connect_id, market_id, languages, transportation, agreements_accepted_at, onboarding_submitted_at, rejection_reason";

export async function getCleanerOnboarding(
  professionalId: string,
): Promise<CleanerOnboardingRecord | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("professionals")
    .select(ONBOARDING_SELECT)
    .eq("id", professionalId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;
  return mapRow(data as Record<string, unknown>);
}

export async function markOnboardingStep(
  professionalId: string,
  step: OnboardingStepId,
  complete = true,
  extras?: {
    marketId?: string | null;
    languages?: string[];
    transportation?: string | null;
    acceptAgreements?: boolean;
  },
): Promise<CleanerOnboardingRecord> {
  const current = await getCleanerOnboarding(professionalId);
  if (!current) throw new Error("Cleaner profile not found.");

  const checklist: OnboardingChecklist = {
    ...current.checklist,
    [step]: complete,
  };
  const nextStatus = nextOnboardingStatusAfterStep(current.onboardingStatus);
  const now = new Date().toISOString();

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("professionals")
    .update({
      onboarding_checklist: checklist as Json,
      onboarding_status: nextStatus,
      market_id: extras?.marketId ?? current.marketId,
      languages: extras?.languages ?? current.languages,
      transportation: extras?.transportation ?? current.transportation,
      agreements_accepted_at: extras?.acceptAgreements
        ? now
        : current.agreementsAcceptedAt,
    })
    .eq("id", professionalId)
    .select(ONBOARDING_SELECT)
    .single();

  if (error || !data) throw new Error(error?.message ?? "Unable to save onboarding step.");
  return mapRow(data as Record<string, unknown>);
}

export async function submitCleanerOnboarding(
  professionalId: string,
): Promise<CleanerOnboardingRecord> {
  const current = await getCleanerOnboarding(professionalId);
  if (!current) throw new Error("Cleaner profile not found.");

  const next = statusAfterSubmit(current.onboardingStatus);
  const now = new Date().toISOString();
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("professionals")
    .update({
      onboarding_status: next,
      onboarding_submitted_at: now,
      onboarding_checklist: {
        ...current.checklist,
        review: true,
      } as Json,
      is_active: false,
      is_online: false,
    })
    .eq("id", professionalId)
    .select(ONBOARDING_SELECT)
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Unable to submit application.");
  }
  return mapRow(data as Record<string, unknown>);
}

export async function reviewCleanerOnboarding(input: {
  professionalId: string;
  adminId: string;
  decision: "approve" | "reject" | "suspend";
  rejectionReason?: string | null;
}): Promise<void> {
  const current = await getCleanerOnboarding(input.professionalId);
  if (!current) throw new Error("Cleaner profile not found.");

  const status = statusAfterAdminReview(input.decision);
  const now = new Date().toISOString();
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("professionals")
    .update({
      onboarding_status: status,
      onboarding_reviewed_at: now,
      rejection_reason:
        input.decision === "reject" || input.decision === "suspend"
          ? input.rejectionReason ?? "Needs more information"
          : null,
      is_verified: input.decision === "approve",
      is_active: input.decision === "approve",
      is_online: false,
      onboarding_checklist: {
        ...current.checklist,
        approval: input.decision === "approve",
      } as Json,
    })
    .eq("id", input.professionalId);

  if (error) throw new Error(error.message);
}

export async function updateStripeConnectState(
  professionalId: string,
  input: { accountId?: string | null; status: StripeConnectStatus },
): Promise<void> {
  const current = await getCleanerOnboarding(professionalId);
  if (!current) throw new Error("Cleaner profile not found.");

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("professionals")
    .update({
      stripe_connect_id: input.accountId ?? current.stripeConnectId,
      stripe_connect_status: input.status,
      onboarding_checklist: {
        ...current.checklist,
        payout: input.status === "ENABLED" || input.status === "PENDING",
      } as Json,
    })
    .eq("id", professionalId);

  if (error) throw new Error(error.message);
}
