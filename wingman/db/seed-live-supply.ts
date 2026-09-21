import { readFileSync } from "node:fs";
import { resolve } from "node:path";
type Sql = {
  query: (query: string, params?: unknown[]) => Promise<unknown>;
};

type LiveEvent = {
  "Event ID": string;
  "Event Name": string;
  Venue: string;
  "Event Date": string;
  "Start Time": string;
  Area: string;
  Category: string;
  Age: string;
  "Official Source": string;
  "Last Verified": string;
  "Available Services": string;
  "Wingman Coverage": string;
  "Booking Status": string;
  "Internal Notes": string;
};

type LiveLead = {
  "Lead ID": string;
  "Organization / Person": string;
  "Lead Type": string;
  "Public Source": string;
  "Public Contact Method": string;
  "Likely Coverage": string;
  "Verification Status": string;
  Owner: string;
  "Next Action": string;
  "Internal Notes": string;
};

type LiveSupply = {
  eventInventory: LiveEvent[];
  wingmanPipeline: LiveLead[];
};

function parseServices(raw: string): string[] {
  return raw
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean);
}

function parseLocalTime(raw: string): { hour: number; minute: number; text: string } {
  const text = raw.trim();
  const match = text.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) {
    return { hour: 23, minute: 0, text };
  }
  let hour = Number(match[1]);
  const minute = Number(match[2]);
  const mer = match[3].toUpperCase();
  if (mer === "PM" && hour < 12) hour += 12;
  if (mer === "AM" && hour === 12) hour = 0;
  return { hour, minute, text };
}

export function loadLiveSupply(): LiveSupply {
  const path = resolve(process.cwd(), "db/seeds/live-supply.json");
  return JSON.parse(readFileSync(path, "utf8")) as LiveSupply;
}

export async function seedLiveSupply(sql: Sql): Promise<{
  venues: number;
  events: number;
  leads: number;
}> {
  const supply = loadLiveSupply();
  const venueIds = new Map<string, string>();

  for (const event of supply.eventInventory) {
    if (venueIds.has(event.Venue)) continue;
    const existing = (await sql.query(
      "SELECT id FROM venues WHERE name = $1 LIMIT 1",
      [event.Venue],
    )) as Array<{ id: string }>;
    if (existing[0]) {
      venueIds.set(event.Venue, existing[0].id);
      continue;
    }
    const inserted = (await sql.query(
      `INSERT INTO venues (name, area, official_url, city, timezone)
       VALUES ($1, $2, $3, 'Miami', 'America/New_York')
       RETURNING id`,
      [event.Venue, event.Area, event["Official Source"]],
    )) as Array<{ id: string }>;
    venueIds.set(event.Venue, inserted[0].id);
  }

  for (const event of supply.eventInventory) {
    const venueId = venueIds.get(event.Venue);
    if (!venueId) throw new Error(`Missing venue for ${event["Event ID"]}`);
    const time = parseLocalTime(event["Start Time"]);
    const startsAt = `${event["Event Date"]}T${String(time.hour).padStart(2, "0")}:${String(time.minute).padStart(2, "0")}:00-04:00`;
    const services = parseServices(event["Available Services"]);
    await sql.query(
      `INSERT INTO events (
         external_id, name, venue_id, starts_at, local_date, local_time_text, timezone,
         area, category, age_requirement, official_source_url, source_verified_at,
         discovery_status, available_services, wingman_coverage, booking_status_note, internal_notes
       ) VALUES (
         $1, $2, $3, $4::timestamptz, $5::date, $6, 'America/New_York',
         $7, $8, $9, $10, $11::timestamptz,
         'discovery_ready', $12::text[], $13, $14, $15
       )
       ON CONFLICT (external_id) DO UPDATE SET
         name = EXCLUDED.name,
         venue_id = EXCLUDED.venue_id,
         starts_at = EXCLUDED.starts_at,
         local_date = EXCLUDED.local_date,
         local_time_text = EXCLUDED.local_time_text,
         area = EXCLUDED.area,
         category = EXCLUDED.category,
         age_requirement = EXCLUDED.age_requirement,
         official_source_url = EXCLUDED.official_source_url,
         source_verified_at = EXCLUDED.source_verified_at,
         available_services = EXCLUDED.available_services,
         wingman_coverage = EXCLUDED.wingman_coverage,
         booking_status_note = EXCLUDED.booking_status_note,
         internal_notes = EXCLUDED.internal_notes,
         updated_at = now()`,
      [
        event["Event ID"],
        event["Event Name"],
        venueId,
        startsAt,
        event["Event Date"],
        time.text,
        event.Area,
        event.Category,
        event.Age,
        event["Official Source"],
        `${event["Last Verified"]}T12:00:00-04:00`,
        services,
        event["Wingman Coverage"],
        event["Booking Status"],
        event["Internal Notes"],
      ],
    );
  }

  for (const lead of supply.wingmanPipeline) {
    await sql.query(
      `INSERT INTO wingman_applications (
         lead_external_id, organization_name, lead_type, public_source, public_contact,
         likely_coverage, verification_status, production_visible, owner_name, next_action, internal_notes
       ) VALUES ($1, $2, $3, $4, $5, $6, 'not_contacted', false, $7, $8, $9)
       ON CONFLICT (lead_external_id) DO UPDATE SET
         organization_name = EXCLUDED.organization_name,
         lead_type = EXCLUDED.lead_type,
         public_source = EXCLUDED.public_source,
         public_contact = EXCLUDED.public_contact,
         likely_coverage = EXCLUDED.likely_coverage,
         next_action = EXCLUDED.next_action,
         internal_notes = EXCLUDED.internal_notes,
         updated_at = now()`,
      [
        lead["Lead ID"],
        lead["Organization / Person"],
        lead["Lead Type"],
        lead["Public Source"],
        lead["Public Contact Method"],
        lead["Likely Coverage"],
        lead.Owner,
        lead["Next Action"],
        lead["Internal Notes"],
      ],
    );
  }

  return {
    venues: venueIds.size,
    events: supply.eventInventory.length,
    leads: supply.wingmanPipeline.length,
  };
}
