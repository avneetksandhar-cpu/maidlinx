import type { AiAgentSlot } from "@/lib/ai/types";

/**
 * First-wave build order (founder): Revenue → Ops → Retention → B2B → Growth → CoS.
 * Only Revenue Director is live in V0.
 */
export const AI_AGENT_SLOTS: AiAgentSlot[] = [
  {
    id: "revenue_director",
    name: "Revenue Director",
    status: "live",
    blurb: "Ranks real revenue opportunities from abandoned checkouts, rebooks, and utilization.",
    buildOrder: 1,
  },
  {
    id: "ops_director",
    name: "Ops Director",
    status: "placeholder",
    blurb: "Next: fulfillment reliability, assignment SLAs, cleaner capacity (not built).",
    buildOrder: 2,
  },
  {
    id: "retention_director",
    name: "Retention Director",
    status: "placeholder",
    blurb: "Later: LTV, churn, rebook cadence (recommend-only until messaging gates clear).",
    buildOrder: 3,
  },
  {
    id: "b2b_sales_director",
    name: "B2B Sales Director",
    status: "placeholder",
    blurb: "Later: commercial pipeline — no fake deals as live truth.",
    buildOrder: 4,
  },
  {
    id: "growth_director",
    name: "Growth Director",
    status: "placeholder",
    blurb: "Later: CAC and channel experiments after core revenue loops.",
    buildOrder: 5,
  },
  {
    id: "chief_of_staff",
    name: "Chief of Staff",
    status: "placeholder",
    blurb: "Later: cross-agent briefs and founder queue triage.",
    buildOrder: 6,
  },
];
