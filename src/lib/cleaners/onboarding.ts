/**
 * MaidLinx Pro onboarding status machine.
 * APPROVED means ops approved the application — never imply background check.
 */

export const CLEANER_ONBOARDING_STATUSES = [
  "NOT_STARTED",
  "IN_PROGRESS",
  "SUBMITTED",
  "UNDER_REVIEW",
  "APPROVED",
  "REJECTED",
  "SUSPENDED",
] as const;

export type CleanerOnboardingStatus = (typeof CLEANER_ONBOARDING_STATUSES)[number];

export const STRIPE_CONNECT_STATUSES = [
  "NOT_STARTED",
  "PENDING",
  "ENABLED",
  "RESTRICTED",
] as const;

export type StripeConnectStatus = (typeof STRIPE_CONNECT_STATUSES)[number];

export const ONBOARDING_STEPS = [
  "personal",
  "profile",
  "service_areas",
  "services",
  "availability",
  "documents",
  "agreements",
  "payout",
  "review",
  "approval",
] as const;

export type OnboardingStepId = (typeof ONBOARDING_STEPS)[number];

export type OnboardingChecklist = Partial<Record<OnboardingStepId, boolean>>;

export function isCleanerOnboardingStatus(value: unknown): value is CleanerOnboardingStatus {
  return (
    typeof value === "string" &&
    (CLEANER_ONBOARDING_STATUSES as readonly string[]).includes(value)
  );
}

export function parseOnboardingStatus(value: unknown): CleanerOnboardingStatus {
  return isCleanerOnboardingStatus(value) ? value : "NOT_STARTED";
}

export function isStripeConnectStatus(value: unknown): value is StripeConnectStatus {
  return (
    typeof value === "string" &&
    (STRIPE_CONNECT_STATUSES as readonly string[]).includes(value)
  );
}

export function parseStripeConnectStatus(value: unknown): StripeConnectStatus {
  return isStripeConnectStatus(value) ? value : "NOT_STARTED";
}

/** Cleaners who may receive offers / appear in matching. */
export function canReceiveJobOffers(status: CleanerOnboardingStatus, isOnline: boolean): boolean {
  return status === "APPROVED" && isOnline;
}

/** Portal access after signup — rejected/suspended still see status, not jobs. */
export function canAccessProJobs(status: CleanerOnboardingStatus): boolean {
  return status === "APPROVED";
}

export function requiresOnboardingRedirect(status: CleanerOnboardingStatus): boolean {
  return (
    status === "NOT_STARTED" ||
    status === "IN_PROGRESS" ||
    status === "REJECTED"
  );
}

export function nextOnboardingStatusAfterStep(
  current: CleanerOnboardingStatus,
): CleanerOnboardingStatus {
  if (current === "NOT_STARTED") return "IN_PROGRESS";
  return current;
}

export function statusAfterSubmit(current: CleanerOnboardingStatus): CleanerOnboardingStatus {
  if (current === "APPROVED" || current === "SUSPENDED") return current;
  return "SUBMITTED";
}

export function statusAfterAdminReview(
  decision: "approve" | "reject" | "suspend",
): CleanerOnboardingStatus {
  if (decision === "approve") return "APPROVED";
  if (decision === "suspend") return "SUSPENDED";
  return "REJECTED";
}

export function checklistProgress(checklist: OnboardingChecklist): {
  completed: number;
  total: number;
  percent: number;
  nextStep: OnboardingStepId | null;
} {
  const actionable = ONBOARDING_STEPS.filter((step) => step !== "approval");
  const completed = actionable.filter((step) => checklist[step] === true).length;
  const total = actionable.length;
  const nextStep = actionable.find((step) => checklist[step] !== true) ?? null;
  return {
    completed,
    total,
    percent: total === 0 ? 0 : Math.round((completed / total) * 100),
    nextStep,
  };
}

/** Public display: first name + last initial. Never full legal last name. */
export function publicCleanerDisplayName(
  firstName: string | null | undefined,
  lastName: string | null | undefined,
): string {
  const first = (firstName ?? "").trim();
  const last = (lastName ?? "").trim();
  if (!first && !last) return "MaidLinx Pro";
  if (!last) return first;
  if (!first) return `${last.charAt(0).toUpperCase()}.`;
  return `${first} ${last.charAt(0).toUpperCase()}.`;
}

export const ONBOARDING_STEP_LABELS: Record<OnboardingStepId, string> = {
  personal: "Personal",
  profile: "Profile",
  service_areas: "Service areas",
  services: "Services",
  availability: "Availability",
  documents: "Documents",
  agreements: "Agreements",
  payout: "Payout",
  review: "Review",
  approval: "Approval",
};
