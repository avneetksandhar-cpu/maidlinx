import {
  assertBusinessMember,
  canViewAccessNotes,
  getOrCreateBusinessAccountForUser,
} from "@/lib/commercial/acl";
import { createAdminClient, hasAdminEnv } from "@/lib/supabase/admin";

export const ENTRY_METHODS = [
  "reception",
  "call_on_arrival",
  "designated_entrance",
] as const;

export type EntryMethod = (typeof ENTRY_METHODS)[number];

export type EntryApplyScope = "this_visit" | "future_visits";

export const ENTRY_METHOD_LABELS: Record<EntryMethod, string> = {
  reception: "Check in at reception",
  call_on_arrival: "Call on arrival",
  designated_entrance: "Use a designated entrance",
};

export interface VisitEntryInstructions {
  method: EntryMethod;
  note: string;
  applyTo: EntryApplyScope;
  updatedAt: string;
}

export function isEntryMethod(value: unknown): value is EntryMethod {
  return (
    typeof value === "string" &&
    (ENTRY_METHODS as readonly string[]).includes(value)
  );
}

export function parseVisitEntryInstructions(
  bookingAnswers: unknown,
): VisitEntryInstructions | null {
  if (!bookingAnswers || typeof bookingAnswers !== "object") return null;
  const entry = (bookingAnswers as Record<string, unknown>).entryInstructions;
  if (!entry || typeof entry !== "object") return null;
  const row = entry as Record<string, unknown>;
  if (!isEntryMethod(row.method)) return null;
  const note = typeof row.note === "string" ? row.note.trim() : "";
  const applyTo: EntryApplyScope =
    row.applyTo === "future_visits" ? "future_visits" : "this_visit";
  const updatedAt =
    typeof row.updatedAt === "string" && row.updatedAt
      ? row.updatedAt
      : new Date(0).toISOString();
  return { method: row.method, note, applyTo, updatedAt };
}

/** Human-readable line for assigned crew only — never put on receipts/email. */
export function formatEntryInstructionsForCrew(
  entry: VisitEntryInstructions,
): string {
  const label = ENTRY_METHOD_LABELS[entry.method];
  const note = entry.note.trim();
  return note ? `${label}. ${note}` : label;
}

/**
 * Crew may read private entry details only when assigned to THIS visit.
 * Business members / admin may always read for sites they own.
 */
export async function canReadVisitEntryInstructions(input: {
  requesterUserId: string;
  requesterRole?: string | null;
  businessAccountId: string | null;
  assignedProfessionalProfileId: string | null;
}): Promise<boolean> {
  if (input.requesterRole === "admin") return true;
  if (
    input.assignedProfessionalProfileId &&
    input.assignedProfessionalProfileId === input.requesterUserId
  ) {
    return true;
  }
  if (!input.businessAccountId) return false;
  return canViewAccessNotes({
    businessAccountId: input.businessAccountId,
    requesterUserId: input.requesterUserId,
    requesterRole: input.requesterRole,
    assignedProviderUserId: input.assignedProfessionalProfileId,
  });
}

export async function getVisitEntryInstructionsForRequester(input: {
  bookingId: string;
  requesterUserId: string;
  requesterRole?: string | null;
}): Promise<{
  entry: VisitEntryInstructions | null;
  siteAddressId: string | null;
  allowed: boolean;
}> {
  if (!hasAdminEnv()) {
    return { entry: null, siteAddressId: null, allowed: false };
  }
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("bookings")
    .select(
      "id, customer_id, professional_profile_id, address_id, service_order_id, booking_answers" as never,
    )
    .eq("id", input.bookingId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return { entry: null, siteAddressId: null, allowed: false };

  const row = data as unknown as Record<string, unknown>;
  const siteAddressId = row.address_id ? String(row.address_id) : null;
  const assigned = row.professional_profile_id
    ? String(row.professional_profile_id)
    : null;
  const customerId = row.customer_id ? String(row.customer_id) : null;

  let businessAccountId: string | null = null;
  if (row.service_order_id) {
    const { data: order } = await supabase
      .from("service_orders" as never)
      .select("business_account_id")
      .eq("id", String(row.service_order_id))
      .maybeSingle();
    if (order) {
      businessAccountId = String(
        (order as Record<string, unknown>).business_account_id,
      );
    }
  }

  const isCustomer = customerId === input.requesterUserId;
  const allowed =
    isCustomer ||
    (await canReadVisitEntryInstructions({
      requesterUserId: input.requesterUserId,
      requesterRole: input.requesterRole,
      businessAccountId,
      assignedProfessionalProfileId: assigned,
    }));

  if (!allowed) {
    return { entry: null, siteAddressId, allowed: false };
  }

  return {
    entry: parseVisitEntryInstructions(row.booking_answers),
    siteAddressId,
    allowed: true,
  };
}

/**
 * Save entry instructions on the visit. Optionally mirror to site scope for future visits.
 * Private details stay in booking_answers / access_notes — never on receipts or email copy.
 */
export async function saveVisitEntryInstructions(input: {
  bookingId: string;
  userId: string;
  method: EntryMethod;
  note: string;
  applyTo: EntryApplyScope;
}): Promise<VisitEntryInstructions> {
  if (!hasAdminEnv()) throw new Error("Database not configured.");
  const supabase = createAdminClient();

  const { data: booking, error } = await supabase
    .from("bookings")
    .select(
      "id, customer_id, address_id, service_order_id, booking_answers, notes" as never,
    )
    .eq("id", input.bookingId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!booking) throw new Error("Booking not found.");

  const row = booking as unknown as Record<string, unknown>;
  if (String(row.customer_id) !== input.userId) {
    // Business managers may also update when they own the site.
    let businessAccountId: string | null = null;
    if (row.service_order_id) {
      const { data: order } = await supabase
        .from("service_orders" as never)
        .select("business_account_id")
        .eq("id", String(row.service_order_id))
        .maybeSingle();
      if (order) {
        businessAccountId = String(
          (order as Record<string, unknown>).business_account_id,
        );
      }
    }
    if (!businessAccountId) throw new Error("You do not have access to this booking.");
    await assertBusinessMember(businessAccountId, input.userId, [
      "owner",
      "manager",
    ]);
  }

  const entry: VisitEntryInstructions = {
    method: input.method,
    note: input.note.trim().slice(0, 500),
    applyTo: input.applyTo,
    updatedAt: new Date().toISOString(),
  };

  const priorAnswers =
    row.booking_answers && typeof row.booking_answers === "object"
      ? (row.booking_answers as Record<string, unknown>)
      : {};

  const nextAnswers = {
    ...priorAnswers,
    commercial: true,
    entryInstructions: entry,
  };

  // Keep booking.notes free of private entry codes so receipts/email stay clean.
  const priorNotes = row.notes ? String(row.notes) : "";
  const sanitizedNotes =
    priorNotes === "Commercial service order visit" || !priorNotes.trim()
      ? "Commercial service order visit"
      : priorNotes.replace(/^Access:[\s\S]*$/m, "").trim() ||
        "Commercial service order visit";

  const { error: updErr } = await supabase
    .from("bookings")
    .update({
      booking_answers: nextAnswers,
      notes: sanitizedNotes,
    } as never)
    .eq("id", input.bookingId);
  if (updErr) throw new Error(updErr.message);

  if (input.applyTo === "future_visits" && row.address_id) {
    const siteAddressId = String(row.address_id);
    const crewLine = formatEntryInstructionsForCrew(entry);
    const account = await getOrCreateBusinessAccountForUser({
      userId: input.userId,
    });
    await assertBusinessMember(account.id, input.userId, ["owner", "manager"]);

    const { data: scope } = await supabase
      .from("commercial_site_scopes" as never)
      .select("id, version, areas, frequency, service_days")
      .eq("site_address_id", siteAddressId)
      .maybeSingle();

    if (scope) {
      const s = scope as Record<string, unknown>;
      await supabase
        .from("commercial_site_scopes" as never)
        .update({
          access_notes: crewLine,
          version: Number(s.version ?? 1) + 1,
          updated_at: new Date().toISOString(),
        } as never)
        .eq("id", String(s.id));
    } else {
      await supabase.from("commercial_site_scopes" as never).insert({
        site_address_id: siteAddressId,
        business_account_id: account.id,
        areas: ["restrooms", "floors", "breakroom", "common_areas"],
        frequency: "weekly",
        service_days: [],
        access_notes: crewLine,
        summary_plain: "Entry instructions saved from booking confirmation.",
        created_by: input.userId,
      } as never);
    }

    await supabase
      .from("addresses")
      .update({
        access_notes: crewLine,
        business_account_id: account.id,
      } as never)
      .eq("id", siteAddressId);
  }

  return entry;
}
