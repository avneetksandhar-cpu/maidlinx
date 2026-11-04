/**
 * Cleaner application payload — no SSN, no government-ID images, no protected-class fields.
 * Supports insured individuals and insured cleaning companies (subcontractors).
 * Insurance is attestation + document URL/status for ops review — never auto-verified.
 */

import { z } from "zod";
import { createAdminClient, hasAdminEnv } from "@/lib/supabase/admin";
import type { Json } from "@/types/database.types";
import { writeCleanerPlatformAudit } from "@/lib/cleaners/platform-audit";

const insuranceDocumentStatusSchema = z.enum([
  "none",
  "attested",
  "uploaded",
  "pending_review",
]);

/** Base fields shared by draft + submit. Attestations relaxed for drafts. */
const cleanerApplicationBaseSchema = z.object({
  applicantType: z.enum(["individual", "cleaning_company"]).default("individual"),
  legalFirstName: z.string().trim().min(1).max(80),
  legalLastName: z.string().trim().min(1).max(80),
  companyName: z.string().trim().max(160).optional().nullable(),
  phone: z.string().trim().min(7).max(32),
  email: z.string().trim().email().max(160),
  city: z.string().trim().min(1).max(80),
  state: z.string().trim().min(2).max(40),
  marketId: z.string().trim().min(1).max(64).optional().nullable(),
  yearsExperience: z.number().int().min(0).max(50),
  hasVehicle: z.boolean(),
  transportation: z.enum(["vehicle", "transit", "bike", "other"]),
  languages: z.array(z.string().trim().min(1).max(40)).max(12).default([]),
  servicesInterested: z.array(z.string().trim().min(1).max(64)).max(20).default([]),
  bio: z.string().trim().max(800).optional().nullable(),
  workAuthAttestation: z.boolean().optional(),
  accurateInfoAttestation: z.boolean().optional(),
  insuranceAttestation: z.boolean().optional(),
  insuranceProvider: z.string().trim().max(120).optional().nullable(),
  insuranceDocumentUrl: z.string().trim().max(500).optional().nullable(),
  insuranceDocumentStatus: insuranceDocumentStatusSchema.optional().nullable(),
  emergencyContactName: z.string().trim().max(80).optional().nullable(),
  emergencyContactPhone: z.string().trim().max(32).optional().nullable(),
});

export const cleanerApplicationSchema = cleanerApplicationBaseSchema;

export type CleanerApplication = z.infer<typeof cleanerApplicationSchema>;

function resolveInsuranceStatus(app: {
  insuranceAttestation?: boolean;
  insuranceDocumentUrl?: string | null;
  insuranceDocumentStatus?: string | null;
}): "none" | "attested" | "uploaded" | "pending_review" {
  const hasDoc = Boolean(app.insuranceDocumentUrl?.trim());
  if (hasDoc) return "pending_review";
  if (app.insuranceAttestation) return "attested";
  if (app.insuranceDocumentStatus && app.insuranceDocumentStatus !== "none") {
    return app.insuranceDocumentStatus as "attested" | "uploaded" | "pending_review";
  }
  return "none";
}

function normalizeApplication(parsed: CleanerApplication): CleanerApplication {
  const companyName =
    parsed.applicantType === "cleaning_company"
      ? parsed.companyName?.trim() || null
      : parsed.companyName?.trim() || null;
  const insuranceDocumentUrl = parsed.insuranceDocumentUrl?.trim() || null;
  return {
    ...parsed,
    companyName,
    insuranceProvider: parsed.insuranceProvider?.trim() || null,
    insuranceDocumentUrl,
    insuranceDocumentStatus: resolveInsuranceStatus({
      ...parsed,
      insuranceDocumentUrl,
    }),
  };
}

function assertSubmitReady(app: CleanerApplication): void {
  if (app.workAuthAttestation !== true) {
    throw new Error("Work authorization attestation is required to submit.");
  }
  if (app.accurateInfoAttestation !== true) {
    throw new Error("Accuracy attestation is required to submit.");
  }
  if (app.insuranceAttestation !== true) {
    throw new Error("Insurance attestation is required to submit.");
  }
  if (app.applicantType === "cleaning_company" && !app.companyName?.trim()) {
    throw new Error("Company name is required for cleaning company applicants.");
  }
}

export async function saveCleanerApplication(input: {
  professionalId: string;
  actorId: string;
  application: CleanerApplication;
  submit?: boolean;
}): Promise<{ application: CleanerApplication; submittedAt: string | null }> {
  if (!hasAdminEnv()) throw new Error("Database not configured.");
  const parsed = normalizeApplication(cleanerApplicationSchema.parse(input.application));
  if (input.submit) assertSubmitReady(parsed);

  const now = new Date().toISOString();
  const supabase = createAdminClient();

  // Write canonical cleaners table — professionals view is often stale without platform cols.
  const { data, error } = await supabase
    .from("cleaners")
    .update({
      application: parsed as unknown as Json,
      application_submitted_at: input.submit ? now : undefined,
      platform_stage: input.submit ? "IDENTITY_PENDING" : "APPLICANT",
      onboarding_status: input.submit ? "SUBMITTED" : "IN_PROGRESS",
      bio: parsed.bio ?? undefined,
      years_experience: parsed.yearsExperience,
      transportation: parsed.transportation,
      languages: parsed.languages,
      market_id: parsed.marketId ?? undefined,
    } as never)
    .eq("id", input.professionalId)
    .select("application, application_submitted_at")
    .single();

  if (error || !data) throw new Error(error?.message ?? "Unable to save application.");

  // Best-effort profile name/phone sync (non-sensitive).
  await supabase
    .from("profiles")
    .update({
      first_name: parsed.legalFirstName,
      last_name: parsed.legalLastName,
      phone: parsed.phone,
    })
    .eq("id", input.actorId);

  await writeCleanerPlatformAudit({
    actorId: input.actorId,
    actorRole: "cleaner",
    action: input.submit ? "application.submit" : "application.save",
    cleanerId: input.professionalId,
    metadata: {
      city: parsed.city,
      state: parsed.state,
      marketId: parsed.marketId ?? null,
      yearsExperience: parsed.yearsExperience,
      applicantType: parsed.applicantType,
      insuranceDocumentStatus: parsed.insuranceDocumentStatus ?? "none",
      companyName: parsed.companyName ?? null,
    },
  });

  const row = data as Record<string, unknown>;
  return {
    application: parsed,
    submittedAt: row.application_submitted_at ? String(row.application_submitted_at) : null,
  };
}

export async function getCleanerApplication(
  professionalId: string,
): Promise<CleanerApplication | null> {
  if (!hasAdminEnv()) return null;
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("cleaners")
    .select("application")
    .eq("id", professionalId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;
  const raw = (data as Record<string, unknown>).application;
  const parsed = cleanerApplicationSchema.safeParse(raw);
  return parsed.success ? normalizeApplication(parsed.data) : null;
}
