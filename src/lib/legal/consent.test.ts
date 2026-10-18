import { describe, expect, it } from "vitest";
import { LEGAL_CONSENT_POLICY_VERSION, isValidLegalConsent } from "./consent";

describe("isValidLegalConsent", () => {
  it("rejects missing or false consent", () => {
    expect(isValidLegalConsent({})).toBe(false);
    expect(
      isValidLegalConsent({
        legalConsentAccepted: false,
        legalConsentPolicyVersion: LEGAL_CONSENT_POLICY_VERSION,
      }),
    ).toBe(false);
    expect(
      isValidLegalConsent({
        legalConsentAccepted: "true",
        legalConsentPolicyVersion: LEGAL_CONSENT_POLICY_VERSION,
      }),
    ).toBe(false);
  });

  it("rejects wrong policy version", () => {
    expect(
      isValidLegalConsent({
        legalConsentAccepted: true,
        legalConsentPolicyVersion: "old-version",
      }),
    ).toBe(false);
  });

  it("accepts current policy version with true flag", () => {
    expect(
      isValidLegalConsent({
        legalConsentAccepted: true,
        legalConsentPolicyVersion: LEGAL_CONSENT_POLICY_VERSION,
      }),
    ).toBe(true);
  });
});
