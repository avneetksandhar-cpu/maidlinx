/**
 * AI executive team — shared types.
 * Money/legal/safety actions stay RED (founder approve). No fake live metrics.
 */

export const AI_AGENTS = [
  "revenue_director",
  "ops_director",
  "retention_director",
  "b2b_sales_director",
  "growth_director",
  "chief_of_staff",
] as const;

export type AiAgentId = (typeof AI_AGENTS)[number];

/** Traffic-light permission model for AI actions. */
export type AiPermissionLevel = "green" | "yellow" | "red";

export type AiActionKind =
  | "brief.generate"
  | "opportunity.rank"
  | "analytics.read"
  | "reminder.recommend"
  | "message.recommend"
  | "campaign.send"
  | "pricing.change"
  | "refund.issue"
  | "payout.change"
  | "contract.sign"
  | "legal.action"
  | "safety.action"
  | "bank.change";

export type AiOpportunityCategory =
  | "abandoned_checkout"
  | "rebook_due"
  | "recurring_candidate"
  | "utilization"
  | "unused_capacity"
  | "commercial_followup"
  | "inactive_high_ltv"
  | "addon_upsell"
  | "referral"
  | "excess_supply"
  | "stale_sales_followup"
  | "data_gap"
  | "other";

export interface AiOpportunity {
  id: string;
  agentId: AiAgentId;
  title: string;
  category: AiOpportunityCategory;
  /** Estimated upside in cents — always labeled estimate, never live truth. */
  potentialCentsEstimate: number | null;
  confidence: number;
  permissionLevel: AiPermissionLevel;
  recommendedAction: string;
  /** Why this appeared; cite real source tables/counts. */
  evidence: string;
  /** true when dollars are modeled estimates, not booked revenue. */
  isEstimate: boolean;
  aiEligible: boolean;
}

export interface AiDataGap {
  key: string;
  label: string;
  reason: string;
  howToFill: string;
}

export interface AiAgentSlot {
  id: AiAgentId;
  name: string;
  status: "live" | "placeholder";
  blurb: string;
  buildOrder: number;
}
