/**
 * Internal B2B / commercial CRM for /owner/sales.
 * Manual leads only — never invent pipeline dollars as live truth.
 */

import { createAdminClient, hasAdminEnv } from "@/lib/supabase/admin";
import type { Json } from "@/types/database.types";

export const SALES_STAGES = [
  "lead",
  "qualified",
  "proposal",
  "negotiation",
  "won",
  "lost",
  "nurture",
] as const;

export type SalesStage = (typeof SALES_STAGES)[number];

export interface SalesLead {
  id: string;
  companyName: string;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  segment: string;
  stage: SalesStage;
  estimatedMonthlyCents: number | null;
  estimatedAnnualCents: number | null;
  nextFollowUpAt: string | null;
  lastContactedAt: string | null;
  ownerNotes: string | null;
  source: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  isEstimate: true;
  staleFollowUp: boolean;
}

function mapLead(row: Record<string, unknown>, nowMs: number): SalesLead {
  const nextFollowUpAt = row.next_follow_up_at ? String(row.next_follow_up_at) : null;
  const status = String(row.status);
  return {
    id: String(row.id),
    companyName: String(row.company_name),
    contactName: row.contact_name ? String(row.contact_name) : null,
    contactEmail: row.contact_email ? String(row.contact_email) : null,
    contactPhone: row.contact_phone ? String(row.contact_phone) : null,
    segment: String(row.segment ?? "commercial"),
    stage: String(row.stage) as SalesStage,
    estimatedMonthlyCents:
      row.estimated_monthly_cents != null ? Number(row.estimated_monthly_cents) : null,
    estimatedAnnualCents:
      row.estimated_annual_cents != null ? Number(row.estimated_annual_cents) : null,
    nextFollowUpAt,
    lastContactedAt: row.last_contacted_at ? String(row.last_contacted_at) : null,
    ownerNotes: row.owner_notes ? String(row.owner_notes) : null,
    source: row.source ? String(row.source) : null,
    status,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
    isEstimate: true,
    staleFollowUp:
      status === "open" &&
      nextFollowUpAt != null &&
      new Date(nextFollowUpAt).getTime() < nowMs,
  };
}

export async function countOpenSalesLeads(): Promise<number | null> {
  if (!hasAdminEnv()) return null;
  try {
    const supabase = createAdminClient();
    const { count, error } = await supabase
      .from("owner_sales_leads")
      .select("*", { count: "exact", head: true })
      .eq("status", "open");
    if (error) return null;
    return count ?? 0;
  } catch {
    return null;
  }
}

export async function countStaleSalesFollowUps(): Promise<number | null> {
  if (!hasAdminEnv()) return null;
  try {
    const supabase = createAdminClient();
    const now = new Date().toISOString();
    const { count, error } = await supabase
      .from("owner_sales_leads")
      .select("*", { count: "exact", head: true })
      .eq("status", "open")
      .lt("next_follow_up_at", now);
    if (error) return null;
    return count ?? 0;
  } catch {
    return null;
  }
}

export async function listSalesLeads(limit = 100): Promise<{
  items: SalesLead[];
  available: boolean;
  gapReason?: string;
}> {
  if (!hasAdminEnv()) {
    return { items: [], available: false, gapReason: "Database not configured." };
  }
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("owner_sales_leads")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(limit);

    if (error) {
      if (/owner_sales_leads|does not exist|schema cache/i.test(error.message)) {
        return {
          items: [],
          available: false,
          gapReason: "Apply migration 00031 (owner_sales_leads).",
        };
      }
      return { items: [], available: false, gapReason: error.message };
    }

    const nowMs = Date.now();
    return {
      items: (data ?? []).map((r) => mapLead(r as Record<string, unknown>, nowMs)),
      available: true,
    };
  } catch (err) {
    return {
      items: [],
      available: false,
      gapReason: err instanceof Error ? err.message : "List failed.",
    };
  }
}

export async function createSalesLead(input: {
  companyName: string;
  contactName?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  segment?: string;
  stage?: SalesStage;
  estimatedMonthlyCents?: number | null;
  estimatedAnnualCents?: number | null;
  nextFollowUpAt?: string | null;
  ownerNotes?: string | null;
  source?: string | null;
  createdByProfileId?: string | null;
}): Promise<{ id: string | null; reason?: string }> {
  if (!hasAdminEnv()) return { id: null, reason: "Database not configured." };
  if (!input.companyName.trim()) return { id: null, reason: "Company name required." };

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("owner_sales_leads")
      .insert({
        company_name: input.companyName.trim(),
        contact_name: input.contactName ?? null,
        contact_email: input.contactEmail ?? null,
        contact_phone: input.contactPhone ?? null,
        segment: input.segment ?? "commercial",
        stage: input.stage ?? "lead",
        estimated_monthly_cents: input.estimatedMonthlyCents ?? null,
        estimated_annual_cents: input.estimatedAnnualCents ?? null,
        next_follow_up_at: input.nextFollowUpAt ?? null,
        owner_notes: input.ownerNotes ?? null,
        source: input.source ?? "owner",
        created_by_profile_id: input.createdByProfileId ?? null,
        metadata: {} as Json,
      } as never)
      .select("id")
      .maybeSingle();

    if (error) {
      if (/owner_sales_leads|does not exist|schema cache/i.test(error.message)) {
        return { id: null, reason: "Apply migration 00031." };
      }
      return { id: null, reason: error.message };
    }
    return { id: data ? String((data as { id: string }).id) : null };
  } catch (err) {
    return { id: null, reason: err instanceof Error ? err.message : "Create failed." };
  }
}

export async function updateSalesLead(input: {
  id: string;
  stage?: SalesStage;
  status?: "open" | "won" | "lost" | "archived";
  nextFollowUpAt?: string | null;
  lastContactedAt?: string | null;
  ownerNotes?: string | null;
  estimatedMonthlyCents?: number | null;
}): Promise<{ ok: boolean; reason?: string }> {
  if (!hasAdminEnv()) return { ok: false, reason: "Database not configured." };
  try {
    const patch: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (input.stage != null) patch.stage = input.stage;
    if (input.status != null) patch.status = input.status;
    if (input.nextFollowUpAt !== undefined) patch.next_follow_up_at = input.nextFollowUpAt;
    if (input.lastContactedAt !== undefined) {
      patch.last_contacted_at = input.lastContactedAt;
    }
    if (input.ownerNotes !== undefined) patch.owner_notes = input.ownerNotes;
    if (input.estimatedMonthlyCents !== undefined) {
      patch.estimated_monthly_cents = input.estimatedMonthlyCents;
    }

    const supabase = createAdminClient();
    const { error } = await supabase
      .from("owner_sales_leads")
      .update(patch as never)
      .eq("id", input.id);
    if (error) return { ok: false, reason: error.message };
    return { ok: true };
  } catch (err) {
    return { ok: false, reason: err instanceof Error ? err.message : "Update failed." };
  }
}

/** Commercial bookings that look like B2B follow-up candidates (real data). */
export async function huntCommercialBookingCandidates(): Promise<{
  count: number;
  estimatedCents: number | null;
  available: boolean;
  gapReason?: string;
}> {
  if (!hasAdminEnv()) {
    return { count: 0, estimatedCents: null, available: false, gapReason: "No admin env." };
  }
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("bookings")
      .select("id, total_cents, status, service_type, completed_at")
      .in("service_type", ["commercial", "office", "airbnb_turnover"])
      .in("status", ["completed", "confirmed", "awaiting_assignment"])
      .limit(500);

    if (error) {
      return { count: 0, estimatedCents: null, available: false, gapReason: error.message };
    }

    const rows = data ?? [];
    const cents = rows.reduce(
      (s, r) => s + Number((r as { total_cents: number }).total_cents ?? 0),
      0,
    );
    return {
      count: rows.length,
      estimatedCents: cents > 0 ? cents : null,
      available: true,
    };
  } catch (err) {
    return {
      count: 0,
      estimatedCents: null,
      available: false,
      gapReason: err instanceof Error ? err.message : "Query failed.",
    };
  }
}
