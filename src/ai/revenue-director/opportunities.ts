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

  const [abandoned, rebook, utilization] = await Promise.all([
    huntAbandonedCheckouts(),
    huntRebookDue(),
    huntUtilization(),
  ]);

  const opportunities = rankOpportunities([
    ...abandoned.opportunities,
    ...rebook.opportunities,
    ...utilization.opportunities,
  ]);

  const gaps = [...abandoned.gaps, ...rebook.gaps, ...utilization.gaps];

  const notes = [
    "Stripe LIVE disabled — figures are estimates or counts, never live GMV claims.",
    "GREEN: analytics + ranked brief. YELLOW: message recommends. RED: campaigns/pricing/refunds/payouts.",
    AI_OUTBOUND_MESSAGING_AUTO_SEND
      ? "Outbound auto-send is ON (unexpected for V0)."
      : "Outbound customer messaging auto-send is OFF (recommend-only).",
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
