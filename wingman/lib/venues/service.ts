import { getSql } from "@/lib/neon";
import { miamiCalendarDate } from "@/lib/events/timezone";
import {
  inferVenueCategory,
  slugifyVenueName,
  VENUE_CATEGORY_LABEL,
  type PublicVenue,
  type VenueApplicationInput,
  type VenueCategory,
  type VenueVerification,
} from "@/lib/venues/types";
import { validateVenueApplication } from "@/lib/venues/verification";

type VenueRow = Record<string, unknown>;

function mapVenue(row: VenueRow, extras?: { upcomingCount?: number; tonightCount?: number }): PublicVenue {
  const name = String(row.name ?? "");
  const hay = `${name} ${row.category ?? ""} ${row.atmosphere ?? ""} ${row.music ?? ""}`;
  const category = (row.category ? String(row.category) : inferVenueCategory(hay)) as VenueCategory | null;
  const slug = String(row.slug || slugifyVenueName(name) || row.id);
  const verification = String(row.verification_status ?? "unclaimed") as VenueVerification;
  return {
    id: String(row.id),
    slug,
    name,
    area: String(row.area ?? ""),
    neighborhood: String(row.neighborhood || row.area || ""),
    city: String(row.city ?? "Miami"),
    category: category && category in VENUE_CATEGORY_LABEL ? category : inferVenueCategory(hay),
    categoryLabel: category && category in VENUE_CATEGORY_LABEL ? VENUE_CATEGORY_LABEL[category] : null,
    atmosphere: row.atmosphere ? String(row.atmosphere) : null,
    dressCode: row.dress_code ? String(row.dress_code) : null,
    music: row.music ? String(row.music) : null,
    hoursText: row.hours_text ? String(row.hours_text) : null,
    description: row.description ? String(row.description) : null,
    officialUrl: row.official_url ? String(row.official_url) : null,
    instagram: row.instagram ? String(row.instagram) : null,
    verificationStatus: verification,
    verified: verification === "verified",
    partner: String(row.source_kind ?? "discovery") === "partner",
    upcomingCount: extras?.upcomingCount ?? Number(row.upcoming_count ?? 0),
    tonightCount: extras?.tonightCount ?? Number(row.tonight_count ?? 0),
  };
}

export async function listPublicVenues(): Promise<PublicVenue[]> {
  const sql = getSql();
  const today = miamiCalendarDate(new Date());
  const rows = (await sql`
    SELECT
      v.*,
      count(e.id)::int AS upcoming_count,
      count(e.id) FILTER (WHERE e.local_date = ${today})::int AS tonight_count
    FROM venues v
    JOIN events e ON e.venue_id = v.id
    WHERE e.discovery_status IN ('discovery_ready', 'bookable')
      AND COALESCE(e.is_test_fixture, false) = false
      AND e.import_status = 'approved'
      AND e.stale = false
      AND e.hidden_at IS NULL
      AND e.merged_into_id IS NULL
      AND e.booking_status <> 'CANCELLED'
      AND COALESCE(e.ends_at, e.starts_at) + interval '6 hours' > now()
    GROUP BY v.id
    ORDER BY count(e.id) DESC, v.name ASC
  `) as VenueRow[];
  return rows.map((row) => mapVenue(row));
}

export async function getPublicVenue(idOrSlug: string): Promise<PublicVenue | null> {
  const sql = getSql();
  const today = miamiCalendarDate(new Date());
  const rows = (await sql`
    SELECT
      v.*,
      count(e.id)::int AS upcoming_count,
      count(e.id) FILTER (WHERE e.local_date = ${today})::int AS tonight_count
    FROM venues v
    LEFT JOIN events e ON e.venue_id = v.id
      AND e.discovery_status IN ('discovery_ready', 'bookable')
      AND COALESCE(e.is_test_fixture, false) = false
      AND e.import_status = 'approved'
      AND e.stale = false
      AND e.hidden_at IS NULL
      AND e.merged_into_id IS NULL
      AND e.booking_status <> 'CANCELLED'
      AND COALESCE(e.ends_at, e.starts_at) + interval '6 hours' > now()
    WHERE v.id::text = ${idOrSlug}
       OR v.slug = ${idOrSlug}
       OR lower(v.name) = ${idOrSlug.toLowerCase()}
       OR lower(regexp_replace(v.name, '[^a-zA-Z0-9]+', '-', 'g')) = ${idOrSlug.toLowerCase()}
    GROUP BY v.id
    LIMIT 1
  `) as VenueRow[];
  return rows[0] ? mapVenue(rows[0]) : null;
}

export async function submitVenueApplication(userId: string, input: VenueApplicationInput) {
  const sql = getSql();
  const checklist = validateVenueApplication(input);
  const name = input.venueName.trim();

  const inserted = (await sql`
    INSERT INTO venue_applications (
      applicant_user_id, venue_name, venue_type, address, neighborhood, city, website, instagram,
      contact_name, contact_title, business_email, phone, legal_name, license_number,
      hours_text, description, music_genres, dress_code, guest_profile, reservation_url,
      ticket_url, table_minimums, upcoming_events, logo_url, hero_photo_url,
      authority_attested, accuracy_attested, media_rights_attested, verification_checklist
    ) VALUES (
      ${userId},
      ${name},
      ${input.venueType.trim()},
      ${input.address.trim()},
      ${input.neighborhood.trim()},
      ${input.city?.trim() || "Miami"},
      ${input.website?.trim() || null},
      ${input.instagram?.trim() || null},
      ${input.contactName.trim()},
      ${input.contactTitle.trim()},
      ${input.businessEmail.trim().toLowerCase()},
      ${input.phone.trim()},
      ${input.legalName.trim()},
      ${input.licenseNumber.trim()},
      ${input.hoursText.trim()},
      ${input.description.trim()},
      ${input.musicGenres.trim()},
      ${input.dressCode.trim()},
      ${input.guestProfile?.trim() || null},
      ${input.reservationUrl?.trim() || null},
      ${input.ticketUrl?.trim() || null},
      ${input.tableMinimums?.trim() || null},
      ${input.upcomingEvents?.trim() || null},
      ${input.logoUrl?.trim() || null},
      ${input.heroPhotoUrl?.trim() || null},
      ${Boolean(input.authorityAttested)},
      ${Boolean(input.accuracyAttested)},
      ${Boolean(input.mediaRightsAttested)},
      ${JSON.stringify(checklist)}::jsonb
    )
    RETURNING id, status
  `) as Array<{ id: string; status: string }>;

  return { id: inserted[0].id, status: inserted[0].status, verified: false, checklist };
}

export async function listVenueApplications() {
  const sql = getSql();
  return (await sql`
    SELECT
      id, venue_id, venue_name, venue_type, address, neighborhood, city, website, instagram,
      contact_name, contact_title, business_email, phone, legal_name, license_number,
      hours_text, description, music_genres, dress_code, guest_profile, reservation_url,
      ticket_url, table_minimums, upcoming_events, logo_url, hero_photo_url,
      authority_attested, accuracy_attested, media_rights_attested, verification_checklist,
      status, review_notes, created_at
    FROM venue_applications
    ORDER BY created_at DESC
    LIMIT 100
  `) as Array<Record<string, unknown>>;
}

export async function approveVenueApplication(applicationId: string, actorId: string) {
  const sql = getSql();
  const apps = (await sql`
    SELECT * FROM venue_applications WHERE id = ${applicationId} LIMIT 1
  `) as VenueRow[];
  const app = apps[0];
  if (!app) throw new Error("Application not found.");
  if (String(app.status) === "approved") throw new Error("Already approved.");
  const ready =
    Boolean(app.authority_attested) &&
    Boolean(app.accuracy_attested) &&
    Boolean(app.media_rights_attested) &&
    String(app.legal_name ?? "").trim().length >= 2 &&
    String(app.license_number ?? "").trim().length >= 2;
  if (!ready) {
    throw new Error("This application is incomplete. The venue must verify its brand and authority first.");
  }

  const name = String(app.venue_name);
  const slug = slugifyVenueName(name);
  const existing = (await sql`
    SELECT id FROM venues WHERE lower(name) = ${name.toLowerCase()} OR slug = ${slug} LIMIT 1
  `) as Array<{ id: string }>;

  let venueId = existing[0]?.id;
  if (!venueId) {
    const created = (await sql`
      INSERT INTO venues (
        name, area, official_url, neighborhood, category, atmosphere, dress_code, music,
        hours_text, description, instagram, phone, contact_name, business_email,
        reservation_url, ticket_url, table_minimum_text, guest_profile,
        legal_name, license_number, contact_title, logo_url, hero_photo_url,
        verification_status, source_kind, slug, claimed_at, verified_at
      ) VALUES (
        ${name},
        ${app.neighborhood ? String(app.neighborhood) : String(app.address).slice(0, 80)},
        ${app.website ? String(app.website) : null},
        ${app.neighborhood ? String(app.neighborhood) : String(app.address).slice(0, 80)},
        ${String(app.venue_type)},
        ${app.description ? String(app.description).slice(0, 120) : null},
        ${app.dress_code ? String(app.dress_code) : null},
        ${app.music_genres ? String(app.music_genres) : null},
        ${app.hours_text ? String(app.hours_text) : null},
        ${app.description ? String(app.description) : null},
        ${app.instagram ? String(app.instagram) : null},
        ${String(app.phone)},
        ${String(app.contact_name)},
        ${String(app.business_email)},
        ${app.reservation_url ? String(app.reservation_url) : null},
        ${app.ticket_url ? String(app.ticket_url) : null},
        ${app.table_minimums ? String(app.table_minimums) : null},
        ${app.guest_profile ? String(app.guest_profile) : null},
        ${app.legal_name ? String(app.legal_name) : null},
        ${app.license_number ? String(app.license_number) : null},
        ${app.contact_title ? String(app.contact_title) : null},
        ${app.logo_url ? String(app.logo_url) : null},
        ${app.hero_photo_url ? String(app.hero_photo_url) : null},
        'verified',
        'partner',
        ${slug},
        now(),
        now()
      )
      RETURNING id
    `) as Array<{ id: string }>;
    venueId = created[0].id;
  } else {
    await sql`
      UPDATE venues
      SET verification_status = 'verified',
          source_kind = 'partner',
          claimed_at = COALESCE(claimed_at, now()),
          verified_at = now(),
          official_url = COALESCE(${app.website ? String(app.website) : null}, official_url),
          instagram = COALESCE(${app.instagram ? String(app.instagram) : null}, instagram),
          updated_at = now()
      WHERE id = ${venueId}
    `;
  }

  if (app.applicant_user_id) {
    await sql`
      INSERT INTO venue_members (venue_id, user_id, member_role)
      VALUES (${venueId}, ${String(app.applicant_user_id)}, 'owner')
      ON CONFLICT (venue_id, user_id) DO NOTHING
    `;
  }

  await sql`
    UPDATE venue_applications
    SET status = 'approved', venue_id = ${venueId}, updated_at = now()
    WHERE id = ${applicationId}
  `;

  return { venueId, actorId };
}

export async function rejectVenueApplication(applicationId: string, notes?: string) {
  const sql = getSql();
  const updated = (await sql`
    UPDATE venue_applications
    SET status = 'rejected',
        review_notes = ${notes?.trim() || "Needs a complete, verifiable brand profile."},
        updated_at = now()
    WHERE id = ${applicationId} AND status <> 'approved'
    RETURNING id, status
  `) as Array<{ id: string; status: string }>;
  if (!updated[0]) throw new Error("Application not found or already approved.");
  return updated[0];
}

export async function createVenueInquiry(input: {
  venueId: string;
  customerId: string | null;
  kind: string;
  message: string;
  partySize?: number;
  dateText?: string;
}) {
  const sql = getSql();
  const message = input.message.trim();
  if (message.length < 4) throw new Error("Add a short note.");
  const kind = ["access", "reserve", "guest_list", "ask_wingman", "plan"].includes(input.kind)
    ? input.kind
    : "access";
  const inserted = (await sql`
    INSERT INTO venue_inquiries (venue_id, customer_id, kind, party_size, date_text, message)
    VALUES (
      ${input.venueId},
      ${input.customerId},
      ${kind},
      ${input.partySize ?? null},
      ${input.dateText ?? null},
      ${message}
    )
    RETURNING id
  `) as Array<{ id: string }>;
  return inserted[0].id;
}

export async function listMyVenueDesk(userId: string) {
  const sql = getSql();
  const venues = (await sql`
    SELECT v.*
    FROM venue_members m
    JOIN venues v ON v.id = m.venue_id
    WHERE m.user_id = ${userId}
    ORDER BY v.name ASC
  `) as VenueRow[];
  const inquiries = (await sql`
    SELECT i.*
    FROM venue_inquiries i
    JOIN venue_members m ON m.venue_id = i.venue_id
    WHERE m.user_id = ${userId}
    ORDER BY i.created_at DESC
    LIMIT 50
  `) as VenueRow[];
  const applications = (await sql`
    SELECT id, venue_name, venue_type, status, created_at, verification_checklist
    FROM venue_applications
    WHERE applicant_user_id = ${userId}
    ORDER BY created_at DESC
    LIMIT 20
  `) as VenueRow[];
  return { venues: venues.map((row) => mapVenue(row)), inquiries, applications };
}
