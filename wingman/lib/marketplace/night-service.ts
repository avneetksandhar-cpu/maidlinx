import type { AuthUser } from "@/lib/auth/types";
import { pickBackupListing, type BackupListing } from "@/lib/marketplace/backup";
import { MIN_BOOKING_CENTS, SPEND_BANDS, type SpendBand } from "@/lib/marketplace/constants";
import {
  BACKUP_ESTIMATE_NOTE,
  BACKUP_LISTING_LABEL,
  BOOK_AGAIN_AVAILABILITY,
  NIGHT_SERVICE_TERMS,
} from "@/lib/marketplace/host-copy";
import { ensureOperatorWingmanSlot } from "@/lib/marketplace/host";
import { getPublicEvent } from "@/lib/marketplace/service";
import {
  CODE_OF_CONDUCT_ACK,
  NO_GUARANTEES_ACK,
  SERVICE_SCOPE_ACK,
} from "@/lib/test-fixtures/constants";
import { getSql } from "@/lib/neon";

export const NIGHT_SERVICE_TOTAL_CENTS = MIN_BOOKING_CENTS;
export const NIGHT_SERVICE_SOURCE = "night_service";

export type NightServiceInput = {
  scopeConductAck: boolean;
  eventId?: string | null;
  eventExternalId?: string | null;
  occasion?: string;
  atmosphere?: string;
  area?: string;
  startsAt?: string;
  groupSize?: number;
  specialRequests?: string;
  repeatRequestId?: string | null;
  spendBand?: SpendBand;
};

type PriorNight = {
  id: string;
  event_id: string | null;
  occasion: string;
  atmosphere: string;
  area: string;
  group_size: number;
};

async function loadPriorNight(customerId: string, requestId: string): Promise<PriorNight | null> {
  const sql = getSql();
  const rows = (await sql`
    SELECT id, event_id, occasion, atmosphere, area, group_size
    FROM booking_requests
    WHERE id = ${requestId} AND customer_id = ${customerId}
    LIMIT 1
  `) as PriorNight[];
  return rows[0] ?? null;
}

export function nightServiceQuote() {
  return {
    subtotalCents: NIGHT_SERVICE_TOTAL_CENTS,
    serviceFeeCents: 0,
    taxesCents: 0,
    customerFeeCents: 0,
    totalCents: NIGHT_SERVICE_TOTAL_CENTS,
    terms: NIGHT_SERVICE_TERMS,
  };
}

export async function createNightServiceBooking(user: AuthUser, input: NightServiceInput) {
  if (!input.scopeConductAck) {
    throw new Error("Confirm the service and conduct line to book.");
  }

  let eventKey = input.eventId?.trim() || input.eventExternalId?.trim() || "";
  let area = (input.area ?? "").trim() || "Miami";
  let atmosphere = (input.atmosphere ?? "").trim() || "Nightlife";
  let occasion = (input.occasion ?? "").trim() || "Night out";
  let startsAt = input.startsAt?.trim() || "";
  let specialRequests = input.specialRequests?.trim() || "";
  let groupSize = input.groupSize ?? 2;
  let repeatFromRequestId: string | null = null;
  let listingStillAvailable = true;

  if (input.repeatRequestId?.trim()) {
    const prior = await loadPriorNight(user.id, input.repeatRequestId.trim());
    if (!prior) {
      throw new Error("That past night was not found on this account.");
    }
    repeatFromRequestId = prior.id;
    if (!eventKey && prior.event_id) eventKey = prior.event_id;
    if (!(input.occasion ?? "").trim()) occasion = prior.occasion;
    if (!(input.atmosphere ?? "").trim()) atmosphere = prior.atmosphere;
    if (!(input.area ?? "").trim()) area = prior.area;
    if (input.groupSize == null) groupSize = prior.group_size;
    if (!specialRequests) {
      specialRequests = `${BOOK_AGAIN_AVAILABILITY} Prior request ${prior.id}.`;
    }
  }

  if (!Number.isInteger(groupSize) || groupSize < 1 || groupSize > 20) {
    throw new Error("Group size must be between 1 and 20.");
  }

  let eventId: string | null = null;
  if (eventKey) {
    const event = await getPublicEvent(eventKey);
    if (!event) {
      if (repeatFromRequestId) {
        listingStillAvailable = false;
      } else {
        throw new Error("That listing was not found. Pick another night or book without an event.");
      }
    } else {
      eventId = String(event.id);
      area = String(event.neighborhood || event.area || area);
      atmosphere = String(event.atmosphere || event.music_genre || event.category || atmosphere);
      occasion = String(event.name || occasion);
      if (!startsAt && event.starts_at) {
        startsAt = new Date(String(event.starts_at)).toISOString();
      }
    }
  }

  if (!startsAt) {
    const tonight = new Date();
    tonight.setHours(23, 0, 0, 0);
    startsAt = tonight.toISOString();
  }

  const slot = await ensureOperatorWingmanSlot();
  const quote = nightServiceQuote();
  if (quote.totalCents !== NIGHT_SERVICE_TOTAL_CENTS) {
    throw new Error("Night service total must be the server $500 amount.");
  }

  const spendBand: SpendBand =
    input.spendBand && SPEND_BANDS.includes(input.spendBand) ? input.spendBand : "band_500_1500";

  const backup = await pickBackupListing({
    id: eventId,
    externalId: eventKey || null,
  });
  const nightPlan = {
    kind: NIGHT_SERVICE_SOURCE,
    backup,
    repeatFromRequestId,
    spendBand,
  };

  const sql = getSql();
  const inserted = (await sql`
    INSERT INTO booking_requests (
      customer_id, event_id, requested_wingman_id, assigned_wingman_id, source,
      occasion, atmosphere, area, starts_at, group_size, spend_band, special_requests,
      requested_services, night_goal, night_plan, status,
      service_scope_ack_at, code_of_conduct_ack_at, no_guarantees_ack_at
    ) VALUES (
      ${user.id},
      ${eventId},
      ${slot.id},
      ${slot.id},
      ${NIGHT_SERVICE_SOURCE},
      ${occasion},
      ${atmosphere},
      ${area},
      ${startsAt}::timestamptz,
      ${groupSize},
      ${spendBand}::spend_band,
      ${specialRequests || NIGHT_SERVICE_TERMS},
      ARRAY['personalized_itinerary']::text[],
      'night_service',
      ${JSON.stringify(nightPlan)}::jsonb,
      'draft',
      now(),
      now(),
      now()
    )
    RETURNING id
  `) as Array<{ id: string }>;

  const requestId = inserted[0].id;
  const quoteRow = (await sql`
    INSERT INTO quotes (
      request_id, wingman_id, subtotal_cents, service_fee_cents,
      taxes_cents, customer_fee_cents, total_cents, terms, status
    ) VALUES (
      ${requestId},
      ${slot.id},
      ${quote.subtotalCents},
      ${quote.serviceFeeCents},
      ${quote.taxesCents},
      ${quote.customerFeeCents},
      ${quote.totalCents},
      ${quote.terms},
      'accepted'
    )
    RETURNING id
  `) as Array<{ id: string }>;

  await sql.query(
    `INSERT INTO audit_events (actor_id, entity_type, entity_id, action, from_state, to_state, payload)
     VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)`,
    [
      user.id,
      "booking_request",
      requestId,
      "night_service_created",
      null,
      "draft",
      JSON.stringify({ quoteId: quoteRow[0].id, totalCents: quote.totalCents, host: slot.displayName }),
    ],
  );

  return {
    requestId,
    quoteId: quoteRow[0].id,
    totalCents: quote.totalCents,
    hostName: slot.hostName,
    hostDisplayName: slot.displayName,
    terms: quote.terms,
    backup,
    bookAgain: Boolean(repeatFromRequestId),
    listingStillAvailable,
    availabilityNote: repeatFromRequestId ? BOOK_AGAIN_AVAILABILITY : null,
    stripeMode: "test" as const,
  };
}

export function backupFromNightPlan(plan: unknown): BackupListing | null {
  if (!plan || typeof plan !== "object") return null;
  const backup = (plan as { backup?: unknown }).backup;
  if (!backup || typeof backup !== "object") return null;
  const row = backup as Partial<BackupListing>;
  if (!row.eventId || !row.externalId || !row.name || !row.venueName) return null;
  return {
    eventId: String(row.eventId),
    externalId: String(row.externalId),
    name: String(row.name),
    venueName: String(row.venueName),
    neighborhood: String(row.neighborhood ?? ""),
    localDate: String(row.localDate ?? ""),
    localTimeText: String(row.localTimeText ?? ""),
    estimatedSpending: String(row.estimatedSpending ?? "Estimate — venue sets prices"),
    estimateNote: String(row.estimateNote ?? BACKUP_ESTIMATE_NOTE),
    officialSourceUrl: String(row.officialSourceUrl ?? ""),
    label: BACKUP_LISTING_LABEL,
    partnershipClaimed: false,
  };
}

export const NIGHT_SERVICE_ACK = `${SERVICE_SCOPE_ACK} ${CODE_OF_CONDUCT_ACK} ${NO_GUARANTEES_ACK}`;
