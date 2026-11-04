/**
 * Referral foundation — architecture only until Product approves accounting.
 * Credits never auto-apply while credits_live is false (default).
 */

import { createAdminClient, hasAdminEnv } from "@/lib/supabase/admin";
import { randomBytes } from "crypto";

/** Product gate — do not flip without accounting + Product approval. */
export const REFERRAL_CREDITS_LIVE = false;

export interface ReferralCodeRow {
  id: string;
  code: string;
  ownerProfileId: string;
  giveCents: number;
  getCents: number;
  isActive: boolean;
  creditsLive: boolean;
}

function generateCode(): string {
  return `MLX${randomBytes(3).toString("hex").toUpperCase()}`;
}

function mapCode(row: Record<string, unknown>): ReferralCodeRow {
  return {
    id: String(row.id),
    code: String(row.code),
    ownerProfileId: String(row.owner_profile_id),
    giveCents: Number(row.give_cents ?? 0),
    getCents: Number(row.get_cents ?? 0),
    isActive: Boolean(row.is_active),
    creditsLive: Boolean(row.credits_live),
  };
}

/** Ensure the customer has a unique referral code (Give $X / Get $Y copy only). */
export async function ensureReferralCode(
  profileId: string,
  defaults: { giveCents?: number; getCents?: number } = {},
): Promise<ReferralCodeRow | null> {
  if (!hasAdminEnv()) return null;
  const supabase = createAdminClient();

  const { data: existing } = await supabase
    .from("referral_codes")
    .select("*")
    .eq("owner_profile_id", profileId)
    .maybeSingle();

  if (existing) return mapCode(existing as Record<string, unknown>);

  const giveCents = defaults.giveCents ?? 2000;
  const getCents = defaults.getCents ?? 2000;

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const code = generateCode();
    const { data, error } = await supabase
      .from("referral_codes")
      .insert({
        code,
        owner_profile_id: profileId,
        give_cents: giveCents,
        get_cents: getCents,
        is_active: true,
        credits_live: false,
      } as never)
      .select("*")
      .single();

    if (!error && data) return mapCode(data as Record<string, unknown>);
    if (error && !/duplicate|unique/i.test(error.message)) {
      if (/referral_codes|does not exist|schema cache/i.test(error.message)) return null;
      throw new Error(error.message);
    }
  }

  return null;
}

export class ReferralError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ReferralError";
  }
}

/**
 * Capture referral attribution only.
 * Rejects self-referral and duplicate referee abuse.
 * Does NOT grant credits while REFERRAL_CREDITS_LIVE / credits_live is false.
 */
export async function captureReferralAttribution(input: {
  code: string;
  refereeProfileId?: string | null;
  refereeEmail?: string | null;
  bookingId?: string | null;
}): Promise<{ captured: boolean; creditsApplied: false; reason?: string }> {
  if (!hasAdminEnv()) {
    return { captured: false, creditsApplied: false, reason: "Database not configured." };
  }

  const normalized = input.code.trim().toUpperCase();
  if (!normalized) {
    return { captured: false, creditsApplied: false, reason: "Missing code." };
  }

  const supabase = createAdminClient();
  const { data: codeRow, error } = await supabase
    .from("referral_codes")
    .select("*")
    .eq("code", normalized)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    if (/referral_codes|does not exist|schema cache/i.test(error.message)) {
      return { captured: false, creditsApplied: false, reason: "Referral tables missing." };
    }
    throw new Error(error.message);
  }
  if (!codeRow) {
    throw new ReferralError("Invalid referral code.");
  }

  const mapped = mapCode(codeRow as Record<string, unknown>);

  if (
    input.refereeProfileId &&
    input.refereeProfileId === mapped.ownerProfileId
  ) {
    throw new ReferralError("You cannot use your own referral code.");
  }

  if (input.refereeEmail) {
    const { data: owner } = await supabase
      .from("users")
      .select("email")
      .eq("id", mapped.ownerProfileId)
      .maybeSingle();
    if (
      owner?.email &&
      String(owner.email).toLowerCase() === input.refereeEmail.trim().toLowerCase()
    ) {
      throw new ReferralError("You cannot use your own referral code.");
    }
  }

  const { error: insertError } = await supabase.from("referral_attributions").insert({
    referral_code_id: mapped.id,
    referrer_profile_id: mapped.ownerProfileId,
    referee_profile_id: input.refereeProfileId ?? null,
    referee_email: input.refereeEmail?.trim().toLowerCase() ?? null,
    booking_id: input.bookingId ?? null,
    status: "captured",
  } as never);

  if (insertError) {
    if (/unique|duplicate/i.test(insertError.message)) {
      throw new ReferralError("This referral was already used.");
    }
    throw new Error(insertError.message);
  }

  // Hard stop: never credit until Product + accounting approve.
  void mapped.creditsLive;
  void REFERRAL_CREDITS_LIVE;

  return { captured: true, creditsApplied: false };
}
