/**
 * MaidLinx Cleaner Platform V1 — pipeline stages + provider connection flags.
 * Never invent ID/background results. Providers stay PENDING until connected.
 */

export const PLATFORM_STAGES = [
  "APPLICANT",
  "IDENTITY_PENDING",
  "SCREENING",
  "TRAINING",
  "APPROVED",
  "ACTIVE",
  "TRUSTED",
  "ELITE",
  "SUSPENDED",
  "REJECTED",
] as const;

export type PlatformStage = (typeof PLATFORM_STAGES)[number];

export const IDENTITY_STATUSES = [
  "not_started",
  "PENDING_PROVIDER",
  "pending",
  "verified",
  "failed",
  "manual_review",
] as const;

export type IdentityStatus = (typeof IDENTITY_STATUSES)[number];

export const BACKGROUND_STATUSES = [
  "not_started",
  "PENDING_PROVIDER",
  "pending",
  "clear",
  "consider",
  "failed",
  "manual_review",
] as const;

export type BackgroundStatus = (typeof BACKGROUND_STATUSES)[number];

/** Env-driven connection flags — never fabricate vendor results. */
export function identityProviderConnected(): boolean {
  return Boolean(
    process.env.IDENTITY_PROVIDER_CONNECTED === "true" ||
      process.env.MAIDLINX_IDENTITY_PROVIDER_URL,
  );
}

export function backgroundProviderConnected(): boolean {
  return Boolean(
    process.env.BACKGROUND_PROVIDER_CONNECTED === "true" ||
      process.env.MAIDLINX_BACKGROUND_PROVIDER_URL,
  );
}

export function defaultIdentityStatus(): IdentityStatus {
  return identityProviderConnected() ? "not_started" : "PENDING_PROVIDER";
}

export function defaultBackgroundStatus(): BackgroundStatus {
  return backgroundProviderConnected() ? "not_started" : "PENDING_PROVIDER";
}

export function isPlatformStage(value: unknown): value is PlatformStage {
  return typeof value === "string" && (PLATFORM_STAGES as readonly string[]).includes(value);
}

export function parsePlatformStage(value: unknown): PlatformStage {
  return isPlatformStage(value) ? value : "APPLICANT";
}

export function isIdentityStatus(value: unknown): value is IdentityStatus {
  return typeof value === "string" && (IDENTITY_STATUSES as readonly string[]).includes(value);
}

export function parseIdentityStatus(value: unknown): IdentityStatus {
  return isIdentityStatus(value) ? value : defaultIdentityStatus();
}

export function isBackgroundStatus(value: unknown): value is BackgroundStatus {
  return typeof value === "string" && (BACKGROUND_STATUSES as readonly string[]).includes(value);
}

export function parseBackgroundStatus(value: unknown): BackgroundStatus {
  return isBackgroundStatus(value) ? value : defaultBackgroundStatus();
}

/** Identity gate passes only when verified (provider) or admin cleared manual_review → verified. */
export function identityGatePassed(status: IdentityStatus): boolean {
  return status === "verified";
}

/**
 * Background gate: `clear` from a connected provider, or admin-cleared after review.
 * PENDING_PROVIDER / pending / consider / failed never auto-pass.
 */
export function backgroundGatePassed(status: BackgroundStatus): boolean {
  return status === "clear";
}

export function derivePlatformStage(input: {
  identityStatus: IdentityStatus;
  backgroundStatus: BackgroundStatus;
  trainingComplete: boolean;
  assessmentPassed: boolean;
  onboardingStatus: string;
  isActive: boolean;
  trustTier?: "TRUSTED" | "ELITE" | null;
  suspended?: boolean;
  rejected?: boolean;
}): PlatformStage {
  if (input.suspended || input.onboardingStatus === "SUSPENDED") return "SUSPENDED";
  if (input.rejected || input.onboardingStatus === "REJECTED") return "REJECTED";
  if (input.trustTier === "ELITE") return "ELITE";
  if (input.trustTier === "TRUSTED") return "TRUSTED";
  if (input.isActive && input.onboardingStatus === "APPROVED") return "ACTIVE";
  if (input.onboardingStatus === "APPROVED") return "APPROVED";
  if (
    identityGatePassed(input.identityStatus) &&
    backgroundGatePassed(input.backgroundStatus) &&
    !input.trainingComplete
  ) {
    return "TRAINING";
  }
  if (
    identityGatePassed(input.identityStatus) &&
    !backgroundGatePassed(input.backgroundStatus)
  ) {
    return "SCREENING";
  }
  if (!identityGatePassed(input.identityStatus)) {
    return input.identityStatus === "PENDING_PROVIDER" || input.identityStatus === "pending"
      ? "IDENTITY_PENDING"
      : "APPLICANT";
  }
  if (!input.trainingComplete || !input.assessmentPassed) return "TRAINING";
  return "APPLICANT";
}

export const PLATFORM_STAGE_LABELS: Record<PlatformStage, string> = {
  APPLICANT: "Applicant",
  IDENTITY_PENDING: "Identity pending",
  SCREENING: "Screening",
  TRAINING: "Training",
  APPROVED: "Approved",
  ACTIVE: "Active",
  TRUSTED: "Trusted",
  ELITE: "Elite",
  SUSPENDED: "Suspended",
  REJECTED: "Rejected",
};
