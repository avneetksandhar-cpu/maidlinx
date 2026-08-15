/**
 * Checkout legal consent — policy version must match what the customer accepted.
 * Bump LEGAL_CONSENT_POLICY_VERSION when Terms/Privacy/cancel/refund/damage text changes materially.
 */
export const LEGAL_CONSENT_POLICY_VERSION = "maidlinx-legal-2026-08-12";

export function isValidLegalConsent(input: {
  legalConsentAccepted?: unknown;
  legalConsentPolicyVersion?: unknown;
}): boolean {
  return (
    input.legalConsentAccepted === true &&
    input.legalConsentPolicyVersion === LEGAL_CONSENT_POLICY_VERSION
  );
}
