/**
 * Configurable server-side approval gates before real jobs.
 * Gates never auto-pass while identity/background providers are disconnected.
 */

import {
  backgroundGatePassed,
  identityGatePassed,
  type BackgroundStatus,
  type IdentityStatus,
} from "@/lib/cleaners/platform";

export const GATE_KEYS = [
  "identity",
  "background",
  "phone",
  "email",
  "agreements",
  "training",
  "assessment",
  "admin_approval",
  "active_status",
] as const;

export type GateKey = (typeof GATE_KEYS)[number];

export interface GateDefinition {
  gateKey: GateKey;
  label: string;
  description?: string;
  required: boolean;
  enabled: boolean;
  sortOrder: number;
}

export interface CleanerGateSnapshot {
  identityStatus: IdentityStatus;
  backgroundStatus: BackgroundStatus;
  phoneVerified: boolean;
  emailVerified: boolean;
  agreementsAccepted: boolean;
  trainingComplete: boolean;
  assessmentPassed: boolean;
  adminApproved: boolean;
  isActive: boolean;
}

export interface GateEvaluation {
  gateKey: GateKey;
  label: string;
  required: boolean;
  enabled: boolean;
  passed: boolean;
  reason: string;
}

export interface GateCheckResult {
  allowed: boolean;
  failedGates: GateKey[];
  evaluations: GateEvaluation[];
}

export const DEFAULT_GATES: GateDefinition[] = [
  {
    gateKey: "identity",
    label: "Identity verification",
    description: "Verified via provider or admin-cleared after review.",
    required: true,
    enabled: true,
    sortOrder: 10,
  },
  {
    gateKey: "background",
    label: "Background screening",
    description: "Clear via provider or admin-cleared after review. Never auto while pending.",
    required: true,
    enabled: true,
    sortOrder: 20,
  },
  {
    gateKey: "phone",
    label: "Phone verified",
    required: true,
    enabled: true,
    sortOrder: 30,
  },
  {
    gateKey: "email",
    label: "Email verified",
    required: true,
    enabled: true,
    sortOrder: 40,
  },
  {
    gateKey: "agreements",
    label: "Agreements accepted",
    required: true,
    enabled: true,
    sortOrder: 50,
  },
  {
    gateKey: "training",
    label: "Academy training complete",
    required: true,
    enabled: true,
    sortOrder: 60,
  },
  {
    gateKey: "assessment",
    label: "Assessment passed",
    required: true,
    enabled: true,
    sortOrder: 70,
  },
  {
    gateKey: "admin_approval",
    label: "Admin approval",
    required: true,
    enabled: true,
    sortOrder: 80,
  },
  {
    gateKey: "active_status",
    label: "Active status",
    required: true,
    enabled: true,
    sortOrder: 90,
  },
];

function evaluateGate(
  gate: GateDefinition,
  snapshot: CleanerGateSnapshot,
): GateEvaluation {
  let passed = false;
  let reason = "Not met";

  switch (gate.gateKey) {
    case "identity":
      passed = identityGatePassed(snapshot.identityStatus);
      reason = passed
        ? "Identity verified"
        : `Identity status is ${snapshot.identityStatus}`;
      break;
    case "background":
      passed = backgroundGatePassed(snapshot.backgroundStatus);
      reason = passed
        ? "Background clear"
        : `Background status is ${snapshot.backgroundStatus}`;
      break;
    case "phone":
      passed = snapshot.phoneVerified;
      reason = passed ? "Phone verified" : "Phone not verified";
      break;
    case "email":
      passed = snapshot.emailVerified;
      reason = passed ? "Email verified" : "Email not verified";
      break;
    case "agreements":
      passed = snapshot.agreementsAccepted;
      reason = passed ? "Agreements accepted" : "Agreements not accepted";
      break;
    case "training":
      passed = snapshot.trainingComplete;
      reason = passed ? "Training complete" : "Training incomplete";
      break;
    case "assessment":
      passed = snapshot.assessmentPassed;
      reason = passed ? "Assessment passed" : "Assessment not passed";
      break;
    case "admin_approval":
      passed = snapshot.adminApproved;
      reason = passed ? "Admin approved" : "Awaiting admin approval";
      break;
    case "active_status":
      passed = snapshot.isActive;
      reason = passed ? "Active" : "Not active";
      break;
    default:
      passed = false;
      reason = "Unknown gate";
  }

  return {
    gateKey: gate.gateKey,
    label: gate.label,
    required: gate.required,
    enabled: gate.enabled,
    passed,
    reason,
  };
}

/**
 * Pure gate check — used by APIs before assign/accept/offer matching.
 */
export function evaluateApprovalGates(
  snapshot: CleanerGateSnapshot,
  gates: GateDefinition[] = DEFAULT_GATES,
): GateCheckResult {
  const evaluations = [...gates]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((gate) => evaluateGate(gate, snapshot));

  const failedGates = evaluations
    .filter((e) => e.enabled && e.required && !e.passed)
    .map((e) => e.gateKey);

  return {
    allowed: failedGates.length === 0,
    failedGates,
    evaluations,
  };
}

/** Convenience: can this cleaner take real marketplace jobs? */
export function canTakeRealJobs(
  snapshot: CleanerGateSnapshot,
  gates?: GateDefinition[],
): boolean {
  return evaluateApprovalGates(snapshot, gates).allowed;
}

export function gateFailureMessage(result: GateCheckResult): string {
  if (result.allowed) return "";
  const labels = result.evaluations
    .filter((e) => result.failedGates.includes(e.gateKey))
    .map((e) => e.label);
  return `Job access blocked until gates pass: ${labels.join(", ")}.`;
}
