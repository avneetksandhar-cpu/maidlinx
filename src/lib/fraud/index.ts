/**
 * Fraud / risk — suspicious accounts, duplicate bookings, payment abuse.
 * @see docs/ALGORITHMS.md §9
 *
 * Must not break legitimate booking or Stripe deposit flows when unimplemented.
 */

export type RiskDecision = "allow" | "review" | "block";

export interface RiskSignal {
  code: string;
  severity: "low" | "medium" | "high";
  detail?: string;
}

export interface RiskAssessmentInput {
  userId?: string;
  email?: string;
  bookingId?: string;
  /** Caller-supplied context (IP, device hash, etc.) — optional. */
  context?: Record<string, string>;
}

export interface RiskAssessment {
  decision: RiskDecision;
  score: number;
  signals: RiskSignal[];
}

/**
 * TODO: Rules engine + admin review queue. Do not hard-block checkout until product-ready.
 */
export function assessRisk(input: RiskAssessmentInput): RiskAssessment {
  void input;
  throw new Error("TODO: src/lib/fraud — assessRisk not implemented");
}
