/**
 * Revenue Director V0 — opportunity hunter.
 * Reads REAL available data only. Never invents pipeline dollars as fact.
 * Potential figures are labeled estimates when present.
 */

import { createAdminClient, hasAdminEnv } from "@/lib/supabase/admin";
import { getPlatformMetrics } from "@/lib/admin/metrics";
import { segmentFromHistory } from "@/lib/brain/retention";
import { confidenceFromSample, BRAIN_MIN_SAMPLE_SIZE } from "@/lib/brain/types";
import type { AiDataGap, AiOpportunity } from "@/lib/ai/types";
import {
  AI_OUTBOUND_MESSAGING_AUTO_SEND,
  permissionLevelForAction,
} from "@/lib/ai/permissions";
import { assertAiActionAllowed } from "@/lib/ai/gateway";
import { upsertOpenOpportunity } from "@/lib/owner/opportunities-store";
import { huntInactiveHighLtv } from "@/lib/owner/customers";
import {
  countStaleSalesFollowUps,
  huntCommercialBookingCandidates,
} from "@/lib/owner/sales";

const REBOOK_DUE_DAYS_MIN = 14;
const REBOOK_DUE_DAYS_MAX = 90;
const ABANDONED_LOOKBACK_DAYS = 14;

export interface RevenueDirectorBrief {
  generatedAt: string;
  opportunities: AiOpportunity[];
  gaps: AiDataGap[];
  notes: string[];
  stripeLiveEnabled: boolean;
  outboundAutoSend: boolean;
}

function emptyBrief(
  extraNotes: string[] = [],
  options?: { gaps?: AiDataGap[] },
): RevenueDirectorBrief {
  const gaps =
    options?.gaps ??
    ([
      {
        key: "db",
        label: "Database / service role",
        reason: "Supabase admin env not configured in this runtime.",
        howToFill: "Set NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (server only).",
      },
    ] satisfies AiDataGap[]);
  return {
    generatedAt: new Date().toISOString(),
    opportunities: [],
    gaps,
    notes: [
      "Stripe LIVE remains disabled by policy.",
      "No invented metrics — empty states are honest.",
      ...extraNotes,
    ],
    stripeLiveEnabled: false,
    outboundAutoSend: AI_OUTBOUND_MESSAGING_AUTO_SEND,
  };
}

function scoreOpportunity(o: AiOpportunity): number {
  const potential = o.potentialCentsEstimate ?? 0;
  return potential * Math.max(0.05, o.confidence) + o.confidence * 1000;
}

export function rankOpportunities(items: AiOpportunity[]): AiOpportunity[] {
  return [...items].sort((a, b) => scoreOpportunity(b) - scoreOpportunity(a));
}

async function huntAbandonedCheckouts(): Promise<{
  opportunities: AiOpportunity[];
  gaps: AiDataGap[];
}> {
  const gaps: AiDataGap[] = [];
  const opportunities: AiOpportunity[] = [];
  const supabase = createAdminClient();
  const since = new Date(
    Date.now() - ABANDONED_LOOKBACK_DAYS * 86_400_000,
  ).toISOString();

  const { data, error } = await supabase
    .from("funnel_events")
    .select("id, event_name, booking_id, profile_id, props, created_at")
    .in("event_name", ["booking_abandoned", "checkout_started", "funnel_abandoned"])
    .gte("created_at", since)
    .limit(500);

  if (error) {
    if (/funnel_events|does not exist|schema cache/i.test(error.message)) {
      gaps.push({
        key: "funnel_events",
        label: "Abandoned checkout funnel",
        reason: "funnel_events table missing or unreachable.",
        howToFill: "Apply pricing/funnel migrations; ensure client persists funnel events.",
      });
      return { opportunities, gaps };
    }
    gaps.push({
      key: "funnel_events_query",
      label: "Abandoned checkout funnel",
      reason: error.message,
      howToFill: "Fix service-role read on funnel_events.",
    });
    return { opportunities, gaps };
  }

  const rows = data ?? [];
  const abandoned = rows.filter((r) => {
    const name = String((r as { event_name: string }).event_name);
    return name === "booking_abandoned" || name === "funnel_abandoned";
  });
  const checkouts = rows.filter(
    (r) => String((r as { event_name: string }).event_name) === "checkout_started",
  );

  if (abandoned.length === 0 && checkouts.length === 0) {
    gaps.push({
      key: "abandoned_empty",
      label: "Abandoned checkouts",
      reason: `No booking_abandoned / checkout_started events in last ${ABANDONED_LOOKBACK_DAYS}d.`,
      howToFill: "Traffic through /book payment path will populate funnel_events.",
    });
    return { opportunities, gaps };
  }

  let estimateSum = 0;
  let estimateCount = 0;
  for (const row of abandoned) {
    const props = (row as { props?: Record<string, unknown> }).props ?? {};
    const total = Number(props.totalCents ?? props.total_cents ?? NaN);
    if (Number.isFinite(total) && total > 0) {
      estimateSum += total;
      estimateCount += 1;
    }
  }

  const avgEstimate =
    estimateCount > 0 ? Math.round(estimateSum / estimateCount) : null;
  const sample = abandoned.length || checkouts.length;
  const confidence = confidenceFromSample(Math.max(sample, BRAIN_MIN_SAMPLE_SIZE));

  opportunities.push({
    id: "opp-abandoned-checkout",
    agentId: "revenue_director",
    title: "Recover abandoned / unfinished checkouts",
    category: "abandoned_checkout",
    potentialCentsEstimate:
      avgEstimate != null ? avgEstimate * abandoned.length : null,
    confidence: abandoned.length >= BRAIN_MIN_SAMPLE_SIZE ? confidence : Math.min(0.4, confidence || 0.25),
    permissionLevel: permissionLevelForAction("message.recommend"),
    recommendedAction: AI_OUTBOUND_MESSAGING_AUTO_SEND
      ? "Queue recovery messages for eligible abandoned sessions."
      : "Recommend recovery outreach (auto-send OFF — founder/ops must approve sends).",
    evidence: `${abandoned.length} abandoned + ${checkouts.length} checkout_started events (${ABANDONED_LOOKBACK_DAYS}d). Avg ticket from props: ${
      avgEstimate != null ? `${avgEstimate}¢` : "unknown"
    }.`,
    isEstimate: true,
    aiEligible: true,
  });

  return { opportunities, gaps };
}

async function huntRebookDue(): Promise<{
  opportunities: AiOpportunity[];
  gaps: AiDataGap[];
}> {
  const gaps: AiDataGap[] = [];
  const opportunities: AiOpportunity[] = [];
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("bookings")
    .select("id, customer_id, status, total_cents, completed_at, created_at")
    .eq("status", "completed")
    .limit(2000);

  if (error) {
    gaps.push({
      key: "bookings_rebook",
      label: "Rebook-due customers",
      reason: error.message,
      howToFill: "Ensure bookings completed_at is written on job complete.",
    });
    return { opportunities, gaps };
  }

  const rows = (data ?? []) as Array<Record<string, unknown>>;
  if (rows.length === 0) {
    gaps.push({
      key: "rebook_empty",
      label: "Rebook-due customers",
      reason: "No completed bookings available to score rebook windows.",
      howToFill: "Complete TEST lifecycle jobs to seed rebook candidates.",
    });
    return { opportunities, gaps };
  }

  const byCustomer = new Map<
    string,
    { count: number; last: number; lastCents: number }
  >();
  for (const row of rows) {
    const cid = row.customer_id ? String(row.customer_id) : null;
    if (!cid) continue;
    const ts = new Date(String(row.completed_at ?? row.created_at)).getTime();
    const cents = Number(row.total_cents ?? 0);
    const prev = byCustomer.get(cid);
    if (!prev) {
      byCustomer.set(cid, { count: 1, last: ts, lastCents: cents });
    } else {
      prev.count += 1;
      if (ts >= prev.last) {
        prev.last = ts;
        prev.lastCents = cents;
      }
    }
  }

  const now = Date.now();
  let due = 0;
  let dueCents = 0;
  for (const [, v] of byCustomer) {
    const days = Math.floor((now - v.last) / (24 * 60 * 60 * 1000));
    const seg = segmentFromHistory({
      completedCount: v.count,
      daysSinceLastCompleted: days,
    });
    if (
      (seg === "active" || seg === "at_risk") &&
      days >= REBOOK_DUE_DAYS_MIN &&
      days <= REBOOK_DUE_DAYS_MAX
    ) {
      due += 1;
      dueCents += v.lastCents > 0 ? v.lastCents : 0;
    }
  }

  if (due === 0) {
    gaps.push({
      key: "rebook_window_empty",
      label: "Rebook-due window",
      reason: `No customers in ${REBOOK_DUE_DAYS_MIN}–${REBOOK_DUE_DAYS_MAX}d since last completed clean.`,
      howToFill: "Natural cadence will fill this as completions age.",
    });
    return { opportunities, gaps };
  }

  const confidence = confidenceFromSample(due);
  opportunities.push({
    id: "opp-rebook-due",
    agentId: "revenue_director",
    title: "Rebook-due customers (14–90d)",
    category: "rebook_due",
    potentialCentsEstimate: dueCents > 0 ? dueCents : null,
    confidence: due >= BRAIN_MIN_SAMPLE_SIZE ? confidence : Math.min(0.45, Math.max(0.2, due / 20)),
    permissionLevel: permissionLevelForAction("reminder.recommend"),
    recommendedAction:
      "Recommend rebook nudges for due customers (no auto-send in V0).",
    evidence: `${due} customers with completed history in rebook window (from ${byCustomer.size} customers with completions). Potential uses last ticket when present — estimate only.`,
    isEstimate: true,
    aiEligible: true,
  });

  return { opportunities, gaps };
}

async function huntUtilization(): Promise<{
  opportunities: AiOpportunity[];
  gaps: AiDataGap[];
}> {
  const gaps: AiDataGap[] = [];
  const opportunities: AiOpportunity[] = [];

  try {
    const metrics = await getPlatformMetrics();
    if (metrics.totalCleaners <= 0) {
      gaps.push({
        key: "utilization_no_cleaners",
        label: "Cleaner utilization",
        reason: "No cleaners in platform metrics — utilization undefined.",
        howToFill: "Onboard / activate cleaners in admin.",
      });
      return { opportunities, gaps };
    }

    const utilizationPct = Math.round(
      (metrics.activeCleaners / metrics.totalCleaners) * 100,
    );
    const idle = Math.max(0, metrics.totalCleaners - metrics.activeCleaners);

    if (idle <= 0) {
      gaps.push({
        key: "utilization_full",
        label: "Cleaner utilization",
        reason: `Active/total cleaners = ${metrics.activeCleaners}/${metrics.totalCleaners} (${utilizationPct}%). No idle supply signal.`,
        howToFill: "Watch capacity via Ops when demand rises.",
      });
      return { opportunities, gaps };
    }

    opportunities.push({
      id: "opp-utilization-idle",
      agentId: "revenue_director",
      title: "Idle cleaner capacity (fill supply)",
      category: "utilization",
      potentialCentsEstimate: null,
      confidence: metrics.totalCleaners >= BRAIN_MIN_SAMPLE_SIZE ? 0.55 : 0.3,
      permissionLevel: permissionLevelForAction("analytics.read"),
      recommendedAction:
        "Prioritize assignment / demand gen in markets with idle active cleaners. Dollar upside not estimated without demand forecasts.",
      evidence: `${metrics.activeCleaners} active / ${metrics.totalCleaners} total cleaners (~${utilizationPct}% active ratio). Idle headcount signal: ${idle}.`,
      isEstimate: true,
      aiEligible: true,
    });
  } catch (err) {
    gaps.push({
      key: "utilization_error",
      label: "Cleaner utilization",
      reason: err instanceof Error ? err.message : "Metrics read failed.",
      howToFill: "Verify admin metrics queries against cleaners table.",
    });
  }

  return { opportunities, gaps };
}

async function huntRecurringCandidates(): Promise<{
  opportunities: AiOpportunity[];
  gaps: AiDataGap[];
}> {
  const gaps: AiDataGap[] = [];
  const opportunities: AiOpportunity[] = [];
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("bookings")
    .select(
      "id, customer_id, status, total_cents, recurring_preference, completed_at" as never,
    )
    .eq("status", "completed")
    .limit(2000);

  if (error) {
    gaps.push({
      key: "recurring_query",
      label: "Recurring candidates",
      reason: error.message,
      howToFill: "Ensure bookings.recurring_preference column exists (00023).",
    });
    return { opportunities, gaps };
  }

  const byCustomer = new Map<
    string,
    { count: number; lastCents: number; hasRecurring: boolean }
  >();
  for (const row of (data ?? []) as unknown as Array<Record<string, unknown>>) {
    const r = row;
    const cid = r.customer_id ? String(r.customer_id) : null;
    if (!cid) continue;
    const pref = r.recurring_preference ? String(r.recurring_preference) : "one_time";
    const prev = byCustomer.get(cid) ?? {
      count: 0,
      lastCents: 0,
      hasRecurring: false,
    };
    prev.count += 1;
    prev.lastCents = Number(r.total_cents ?? 0) || prev.lastCents;
    if (pref !== "one_time" && pref !== "") prev.hasRecurring = true;
    byCustomer.set(cid, prev);
  }

  let candidates = 0;
  let estimate = 0;
  for (const [, v] of byCustomer) {
    if (v.count >= 2 && !v.hasRecurring) {
      candidates += 1;
      estimate += v.lastCents > 0 ? Math.round(v.lastCents * 4) : 0;
    }
  }

  if (candidates === 0) {
    gaps.push({
      key: "recurring_empty",
      label: "Recurring candidates",
      reason: "No repeat completers without a recurring preference.",
      howToFill: "Complete repeat TEST bookings; prefer weekly/biweekly in wizard.",
    });
    return { opportunities, gaps };
  }

  opportunities.push({
    id: "opp-recurring-candidates",
    agentId: "revenue_director",
    title: "Convert repeats to recurring plans",
    category: "recurring_candidate",
    potentialCentsEstimate: estimate > 0 ? estimate : null,
    confidence: confidenceFromSample(candidates),
    permissionLevel: permissionLevelForAction("reminder.recommend"),
    recommendedAction:
      "Recommend recurring cadence (no auto-enroll / no auto-charge in V0).",
    evidence: `${candidates} customers with ≥2 completions and no recurring preference. Estimate = ~4× last ticket (labeled estimate).`,
    isEstimate: true,
    aiEligible: true,
  });

  return { opportunities, gaps };
}

async function huntInactiveLtv(): Promise<{
  opportunities: AiOpportunity[];
  gaps: AiDataGap[];
}> {
  const gaps: AiDataGap[] = [];
  const opportunities: AiOpportunity[] = [];
  const hunt = await huntInactiveHighLtv(40);
  if (!hunt.available) {
    gaps.push({
      key: "inactive_ltv",
      label: "Inactive high-LTV",
      reason: hunt.gapReason ?? "Unavailable",
      howToFill: "Need completed bookings with customer_id + totals.",
    });
    return { opportunities, gaps };
  }
  if (hunt.count === 0) {
    gaps.push({
      key: "inactive_ltv_empty",
      label: "Inactive high-LTV",
      reason: "No customers with LTV ≥ $150 and ≥60d silence.",
      howToFill: "Natural aging of completed customers fills this window.",
    });
    return { opportunities, gaps };
  }

  opportunities.push({
    id: "opp-inactive-high-ltv",
    agentId: "revenue_director",
    title: "Win back inactive high-LTV customers",
    category: "inactive_high_ltv",
    potentialCentsEstimate: hunt.estimatedCents,
    confidence: confidenceFromSample(hunt.count),
    permissionLevel: permissionLevelForAction("message.recommend"),
    recommendedAction:
      "Recommend win-back outreach (auto-send OFF — create opportunity only).",
    evidence: `${hunt.count} customers (LTV≥$150, silent ≥60d). Estimate ≈ 25% of LTV — estimate only.`,
    isEstimate: true,
    aiEligible: true,
  });
  return { opportunities, gaps };
}

async function huntCommercialFollowup(): Promise<{
  opportunities: AiOpportunity[];
  gaps: AiDataGap[];
}> {
  const gaps: AiDataGap[] = [];
  const opportunities: AiOpportunity[] = [];
  const commercial = await huntCommercialBookingCandidates();
  const stale = await countStaleSalesFollowUps();

  if (!commercial.available) {
    gaps.push({
      key: "commercial",
      label: "Commercial / PM follow-up",
      reason: commercial.gapReason ?? "Unavailable",
      howToFill: "Commercial/office/airbnb bookings populate this signal.",
    });
  } else if (commercial.count === 0 && (stale ?? 0) === 0) {
    gaps.push({
      key: "commercial_empty",
      label: "Commercial / PM follow-up",
      reason: "No commercial bookings and no stale CRM follow-ups.",
      howToFill: "Add B2B leads in /owner/sales or book commercial TEST jobs.",
    });
  } else {
    if (commercial.count > 0) {
      opportunities.push({
        id: "opp-commercial-followup",
        agentId: "b2b_sales_director",
        title: "Commercial / PM account follow-up",
        category: "commercial_followup",
        potentialCentsEstimate: commercial.estimatedCents,
        confidence: confidenceFromSample(commercial.count),
        permissionLevel: permissionLevelForAction("reminder.recommend"),
        recommendedAction:
          "Review commercial bookings; add/update CRM leads (no auto outbound).",
        evidence: `${commercial.count} commercial/office/airbnb bookings in sample. Dollar figure is historical ticket sum — estimate for expansion.`,
        isEstimate: true,
        aiEligible: true,
      });
    }
    if ((stale ?? 0) > 0) {
      opportunities.push({
        id: "opp-stale-sales",
        agentId: "b2b_sales_director",
        title: "Stale B2B CRM follow-ups",
        category: "stale_sales_followup",
        potentialCentsEstimate: null,
        confidence: 0.7,
        permissionLevel: permissionLevelForAction("reminder.recommend"),
        recommendedAction: "Work overdue follow-ups in /owner/sales.",
        evidence: `${stale} open leads with next_follow_up_at in the past.`,
        isEstimate: true,
        aiEligible: true,
      });
    }
  }

  return { opportunities, gaps };
}

async function huntAddonAndReferral(): Promise<{
  opportunities: AiOpportunity[];
  gaps: AiDataGap[];
}> {
  const gaps: AiDataGap[] = [];
  const opportunities: AiOpportunity[] = [];
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("bookings")
    .select("id, status, total_cents, extras, service_type, customer_id")
    .eq("status", "completed")
    .limit(1000);

  if (error) {
    gaps.push({
      key: "addon_referral",
      label: "Add-on / referral",
      reason: error.message,
      howToFill: "Completed bookings required.",
    });
    return { opportunities, gaps };
  }

  const rows = (data ?? []) as Array<Record<string, unknown>>;
  let withoutExtras = 0;
  let withoutExtrasCents = 0;
  const customerCounts = new Map<string, number>();
  for (const r of rows) {
    const extras = r.extras;
    const emptyExtras =
      extras == null ||
      (Array.isArray(extras) && extras.length === 0) ||
      (typeof extras === "object" &&
        !Array.isArray(extras) &&
        Object.keys(extras as object).length === 0);
    if (emptyExtras) {
      withoutExtras += 1;
      withoutExtrasCents += Number(r.total_cents ?? 0);
    }
    const cid = r.customer_id ? String(r.customer_id) : null;
    if (cid) customerCounts.set(cid, (customerCounts.get(cid) ?? 0) + 1);
  }

  const referEligible = Array.from(customerCounts.values()).filter((n) => n >= 2).length;

  if (withoutExtras === 0) {
    gaps.push({
      key: "addon_empty",
      label: "Add-on upsell",
      reason: "No completed bookings without extras in sample.",
      howToFill: "Track extras on bookings for upsell detection.",
    });
  } else {
    opportunities.push({
      id: "opp-addon-upsell",
      agentId: "revenue_director",
      title: "Add-on upsell on bare tickets",
      category: "addon_upsell",
      potentialCentsEstimate:
        withoutExtras > 0 ? Math.round((withoutExtrasCents / withoutExtras) * 0.15 * withoutExtras) : null,
      confidence: confidenceFromSample(withoutExtras),
      permissionLevel: permissionLevelForAction("reminder.recommend"),
      recommendedAction:
        "Recommend add-on prompts at rebook (no auto messages).",
      evidence: `${withoutExtras} completed bookings with empty extras. Estimate ≈ 15% of avg ticket × count.`,
      isEstimate: true,
      aiEligible: true,
    });
  }

  if (referEligible === 0) {
    gaps.push({
      key: "referral_empty",
      label: "Referral",
      reason: "No customers with ≥2 completions for referral ask.",
      howToFill: "Repeat completers become referral candidates.",
    });
  } else {
    opportunities.push({
      id: "opp-referral",
      agentId: "growth_director",
      title: "Referral asks from happy repeats",
      category: "referral",
      potentialCentsEstimate: null,
      confidence: confidenceFromSample(referEligible),
      permissionLevel: permissionLevelForAction("message.recommend"),
      recommendedAction:
        "Recommend referral ask after positive ratings (auto-send OFF).",
      evidence: `${referEligible} customers with ≥2 completions. Dollar upside not estimated without referral program metrics.`,
      isEstimate: true,
      aiEligible: true,
    });
  }

  return { opportunities, gaps };
}

async function huntExcessSupply(): Promise<{
  opportunities: AiOpportunity[];
  gaps: AiDataGap[];
}> {
  const gaps: AiDataGap[] = [];
  const opportunities: AiOpportunity[] = [];
  try {
    const metrics = await getPlatformMetrics();
    const idle = Math.max(0, metrics.totalCleaners - metrics.activeCleaners);
    const upcomingPressure = metrics.activeBookings;
    if (idle >= 2 && upcomingPressure < Math.max(2, idle)) {
      opportunities.push({
        id: "opp-excess-supply",
        agentId: "ops_director",
        title: "Excess supply windows",
        category: "excess_supply",
        potentialCentsEstimate: null,
        confidence: 0.4,
        permissionLevel: permissionLevelForAction("analytics.read"),
        recommendedAction:
          "Match demand gen / offers to idle supply (recommend-only).",
        evidence: `${idle} inactive vs ${metrics.activeCleaners} active cleaners; ${upcomingPressure} active bookings.`,
        isEstimate: true,
        aiEligible: true,
      });
    } else {
      gaps.push({
        key: "excess_supply_none",
        label: "Excess supply",
        reason: "No clear idle-supply vs demand imbalance in platform metrics.",
        howToFill: "Watch /owner/cleaners for market/day skew.",
      });
    }
  } catch (err) {
    gaps.push({
      key: "excess_supply_err",
      label: "Excess supply",
      reason: err instanceof Error ? err.message : "Metrics failed",
      howToFill: "Verify professionals + bookings metrics.",
    });
  }
  return { opportunities, gaps };
}

export async function buildRevenueDirectorBrief(): Promise<RevenueDirectorBrief> {
  if (!hasAdminEnv()) {
    return emptyBrief();
  }

  const gate = await assertAiActionAllowed({
    agentId: "revenue_director",
    action: "brief.generate",
  });
  if (!gate.allowed) {
    return emptyBrief(
      [
        `Revenue Director paused/blocked: ${gate.reason}`,
        "Toggle Global AI Pause or AI_REVENUE_DIRECTOR in /owner controls.",
      ],
      {
        gaps: [
          {
            key: "ai_pause",
            label: "AI pause / agent disabled",
            reason: gate.reason,
            howToFill: "Owner command center → Controls → clear Global Pause and enable Revenue Director.",
          },
        ],
      },
    );
  }

  const [
    abandoned,
    rebook,
    utilization,
    recurring,
    inactive,
    commercial,
    addonReferral,
    excess,
  ] = await Promise.all([
    huntAbandonedCheckouts(),
    huntRebookDue(),
    huntUtilization(),
    huntRecurringCandidates(),
    huntInactiveLtv(),
    huntCommercialFollowup(),
    huntAddonAndReferral(),
    huntExcessSupply(),
  ]);

  const opportunities = rankOpportunities([
    ...abandoned.opportunities,
    ...rebook.opportunities,
    ...utilization.opportunities,
    ...recurring.opportunities,
    ...inactive.opportunities,
    ...commercial.opportunities,
    ...addonReferral.opportunities,
    ...excess.opportunities,
  ]);

  // Persist open opportunities (create only — no auto messages). Soft-fail.
  await Promise.all(opportunities.map((opp) => upsertOpenOpportunity(opp)));

  const gaps = [
    ...abandoned.gaps,
    ...rebook.gaps,
    ...utilization.gaps,
    ...recurring.gaps,
    ...inactive.gaps,
    ...commercial.gaps,
    ...addonReferral.gaps,
    ...excess.gaps,
  ];

  const notes = [
    "Stripe LIVE disabled — figures are estimates or counts, never live GMV claims.",
    "GREEN: analytics + ranked brief. YELLOW: message recommends. RED: campaigns/pricing/refunds/payouts.",
    AI_OUTBOUND_MESSAGING_AUTO_SEND
      ? "Outbound auto-send is ON (unexpected for V0)."
      : "Outbound customer messaging auto-send is OFF — opportunities only, no auto messages.",
  ];

  if (opportunities.length === 0) {
    notes.push("No ranked opportunities yet — see data gaps below.");
  }

  return {
    generatedAt: new Date().toISOString(),
    opportunities,
    gaps,
    notes,
    stripeLiveEnabled: false,
    outboundAutoSend: AI_OUTBOUND_MESSAGING_AUTO_SEND,
  };
}
