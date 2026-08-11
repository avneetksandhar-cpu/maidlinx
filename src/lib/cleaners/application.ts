/**
 * Cleaner application payload — no SSN, no government-ID images, no protected-class fields.
 */

import { z } from "zod";
import { createAdminClient, hasAdminEnv } from "@/lib/supabase/admin";
import type { Json } from "@/types/database.types";
import { writeCleanerPlatformAudit } from "@/lib/cleaners/platform-audit";

export const cleanerApplicationSchema = z.object({
  legalFirstName: z.string().trim().min(1).max(80),
  legalLastName: z.string().trim().min(1).max(80),
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
  workAuthAttestation: z.literal(true),
  accurateInfoAttestation: z.literal(true),
  emergencyContactName: z.string().trim().max(80).optional().nullable(),
  emergencyContactPhone: z.string().trim().max(32).optional().nullable(),
});

export type CleanerApplication = z.infer<typeof cleanerApplicationSchema>;

export async function saveCleanerApplication(input: {
  professionalId: string;
  actorId: string;
  application: CleanerApplication;
  submit?: boolean;
}): Promise<{ application: CleanerApplication; submittedAt: string | null }> {
  if (!hasAdminEnv()) throw new Error("Database not configured.");
  const parsed = cleanerApplicationSchema.parse(input.application);
  const now = new Date().toISOString();
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("professionals")
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
    })
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
    .from("professionals")
    .select("application")
    .eq("id", professionalId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;
  const raw = (data as Record<string, unknown>).application;
  const parsed = cleanerApplicationSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}
