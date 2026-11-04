type Queryable = {
  query: (text: string, params?: unknown[]) => Promise<unknown>;
};
import pg from "pg";
import { hashPassword } from "@/lib/auth/password";
import { DEFAULT_PERMISSIONS } from "@/lib/auth/types";
import {
  TEST_CUSTOMER_EMAIL,
  TEST_CUSTOMER_NAME,
  TEST_EVENT_EXTERNAL_ID,
  TEST_EVENT_NAME,
  TEST_LABEL,
  TEST_OFFER_TERMS,
  TEST_SERVICE_FEE_CENTS,
  TEST_SUBTOTAL_CENTS,
  TEST_VENUE_NAME,
  TEST_WINGMAN_DISPLAY_NAME,
  TEST_WINGMAN_EMAIL,
} from "@/lib/test-fixtures/constants";
import { testFixturesEnabled } from "@/lib/test-fixtures/env";

type Sql = Queryable;

async function removeTestFixtures(sql: Sql) {
  await sql.query(
    `DELETE FROM incident_reports WHERE is_test_fixture = true OR request_id IN (SELECT id FROM booking_requests WHERE is_test_fixture = true)`,
  );
  await sql.query(
    `DELETE FROM customer_reviews WHERE is_test_fixture = true OR booking_id IN (SELECT id FROM bookings WHERE is_test_fixture = true)`,
  );
  await sql.query(
    `DELETE FROM booking_checkins WHERE is_test_fixture = true OR booking_id IN (SELECT id FROM bookings WHERE is_test_fixture = true)`,
  );
  await sql.query(
    `DELETE FROM messages WHERE request_id IN (SELECT id FROM booking_requests WHERE is_test_fixture = true)`,
  );
  await sql.query(`DELETE FROM payments WHERE is_test_fixture = true`);
  await sql.query(`DELETE FROM bookings WHERE is_test_fixture = true`);
  await sql.query(`DELETE FROM quotes WHERE is_test_fixture = true`);
  await sql.query(`DELETE FROM booking_requests WHERE is_test_fixture = true`);
  await sql.query(`DELETE FROM wingman_event_offers WHERE is_test_fixture = true`);
  await sql.query(`DELETE FROM wingman_event_marks WHERE wingman_id IN (SELECT id FROM wingmen WHERE is_test_fixture = true)`);
  await sql.query(`DELETE FROM wingmen WHERE is_test_fixture = true`);
  await sql.query(`DELETE FROM wingman_applications WHERE is_test_fixture = true`);
  await sql.query(`DELETE FROM events WHERE is_test_fixture = true`);
  await sql.query(`DELETE FROM venues WHERE name = $1`, [TEST_VENUE_NAME]);
  await sql.query(`DELETE FROM sessions WHERE user_id IN (SELECT id FROM profiles WHERE is_test_fixture = true)`);
  await sql.query(
    `DELETE FROM auth_users WHERE email = ANY($1::text[])`,
    [[TEST_CUSTOMER_EMAIL, TEST_WINGMAN_EMAIL]],
  );
  await sql.query(`DELETE FROM test_fixture_registry`);
  await sql.query(
    `UPDATE feature_flags SET enabled = false, updated_at = now() WHERE key = 'enable_test_fixtures'`,
  );
}

async function upsertTestUser(sql: Sql, url: string, email: string, name: string, role: "member" | "partner") {
  const seedPassword = process.env.SEED_PASSWORD;
  if (!seedPassword) throw new Error("SEED_PASSWORD is required to seed TEST users.");
  const hash = hashPassword(seedPassword);
  const existing = (await sql.query("SELECT id FROM auth_users WHERE email = $1 LIMIT 1", [email])) as Array<{
    id: string;
  }>;
  if (existing[0]) {
    const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
    await client.connect();
    try {
      await client.query("BEGIN");
      await client.query("SELECT set_config($1, $2, true)", ["app.user_id", existing[0].id]);
      await client.query("SELECT set_config($1, $2, true)", ["app.role", "owner"]);
      await client.query("UPDATE auth_users SET password_hash = $1, updated_at = now() WHERE id = $2", [
        hash,
        existing[0].id,
      ]);
      await client.query(
        `UPDATE profiles
         SET role = $2::user_role,
             membership_tier = 'basic',
             approval_status = 'approved',
             display_name = $3,
             permissions = $4::jsonb,
             is_test_fixture = true,
             updated_at = now()
         WHERE id = $1`,
        [existing[0].id, role, name, JSON.stringify(DEFAULT_PERMISSIONS[role])],
      );
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      await client.end();
    }
    return existing[0].id;
  }

  await sql.query(
    `SELECT provision_user($1, $2, $3, $4::user_role, 'basic'::membership_tier, 'approved'::approval_status, $5::jsonb)`,
    [email, hash, name, role, JSON.stringify(DEFAULT_PERMISSIONS[role])],
  );
  const created = (await sql.query("SELECT id FROM auth_users WHERE email = $1 LIMIT 1", [email])) as Array<{
    id: string;
  }>;
  const userId = created[0].id;
  await sql.query(`UPDATE profiles SET is_test_fixture = true WHERE id = $1`, [userId]);
  return userId;
}

export async function seedOrRemoveTestFixtures(sql: Sql): Promise<{
  seeded: boolean;
  removed: boolean;
}> {
  if (!testFixturesEnabled()) {
    await removeTestFixtures(sql);
    return { seeded: false, removed: true };
  }

  const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is required");

  const customerId = await upsertTestUser(sql, url, TEST_CUSTOMER_EMAIL, TEST_CUSTOMER_NAME, "member");
  const wingmanUserId = await upsertTestUser(sql, url, TEST_WINGMAN_EMAIL, TEST_WINGMAN_DISPLAY_NAME, "partner");

  const existingVenue = (await sql.query(`SELECT id FROM venues WHERE name = $1 LIMIT 1`, [
    TEST_VENUE_NAME,
  ])) as Array<{ id: string }>;
  let venueId = existingVenue[0]?.id;
  if (!venueId) {
    const createdVenue = (await sql.query(
      `INSERT INTO venues (name, area, official_url, city, timezone)
       VALUES ($1, 'Miami Beach', 'https://example.invalid/test-venue', 'Miami', 'America/New_York')
       RETURNING id`,
      [TEST_VENUE_NAME],
    )) as Array<{ id: string }>;
    venueId = createdVenue[0].id;
  }

  const source = (await sql.query(`SELECT id FROM event_sources WHERE slug = 'admin' LIMIT 1`)) as Array<{
    id: string;
  }>;

  const starts = new Date();
  starts.setDate(starts.getDate() + 14);
  const localDate = starts.toISOString().slice(0, 10);

  await sql.query(
    `INSERT INTO events (
       external_id, name, venue_id, starts_at, local_date, local_time_text, timezone,
       area, neighborhood, category, event_type, age_requirement, official_source_url,
       source_verified_at, discovery_status, booking_status, import_status, hidden_at,
       booking_status_note, internal_notes, primary_source_id, last_seen_at, last_synced_at,
       image_usage_verified, is_test_fixture, stale
     ) VALUES (
       $1, $2, $3, $4::timestamptz, $5::date, '11:00 PM', 'America/New_York',
       'Miami Beach', 'Miami Beach', 'Nightlife', 'Nightlife', '21+',
       'https://example.invalid/test-event', now(), 'draft', 'DISCOVERY_ONLY', 'approved',
       now(), 'TEST fixture — hidden from public directory.',
       'Private TEST booking fixture. Remove before production.',
       $6, now(), now(), false, true, false
     )
     ON CONFLICT (external_id) DO UPDATE SET
       name = EXCLUDED.name,
       hidden_at = now(),
       discovery_status = 'draft',
       booking_status = 'DISCOVERY_ONLY',
       is_test_fixture = true,
       updated_at = now()`,
    [TEST_EVENT_EXTERNAL_ID, TEST_EVENT_NAME, venueId, `${localDate}T23:00:00-04:00`, localDate, source[0]?.id ?? null],
  );

  const event = (await sql.query(`SELECT id FROM events WHERE external_id = $1`, [TEST_EVENT_EXTERNAL_ID])) as Array<{
    id: string;
  }>;
  const eventId = event[0].id;

  await sql.query(
    `INSERT INTO wingman_applications (
       lead_external_id, organization_name, lead_type, verification_status, production_visible,
       internal_notes, is_test_fixture, user_id, consent_at, identity_verified_at, phone_verified_at,
       email_verified_at, inventory_authority_at, agreement_signed_at, payout_approved_at,
       media_cleared_at, policy_accepted_at, test_booking_at
     ) VALUES (
       'TEST-WINGMAN-APPLICATION', $1, 'TEST fixture', 'approved', false,
       'Private TEST Wingman. Not a public profile.',
       true, $2, now(), now(), now(), now(), now(), now(), now(), now(), now(), now()
     )
     ON CONFLICT (lead_external_id) DO UPDATE SET
       user_id = EXCLUDED.user_id,
       is_test_fixture = true,
       production_visible = false,
       updated_at = now()`,
    [TEST_WINGMAN_DISPLAY_NAME, wingmanUserId],
  );
  const application = (
    (await sql.query(`SELECT id FROM wingman_applications WHERE lead_external_id = 'TEST-WINGMAN-APPLICATION'`)) as Array<{
      id: string;
    }>
  )[0];

  await sql.query(
    `INSERT INTO wingmen (
       application_id, user_id, display_name, areas, specialties, languages, biography,
       verification_status, is_test_fixture
     ) VALUES (
       $1, $2, $3, ARRAY['Miami Beach']::text[], ARRAY['TEST concierge']::text[],
       ARRAY['en']::text[], 'TEST fixture — never listed on /wingmen.',
       'verified', true
     )
     ON CONFLICT (user_id) DO UPDATE SET
       display_name = EXCLUDED.display_name,
       verification_status = 'verified',
       is_test_fixture = true,
       updated_at = now()`,
    [application?.id ?? null, wingmanUserId, TEST_WINGMAN_DISPLAY_NAME],
  );

  const wingman = (await sql.query(`SELECT id FROM wingmen WHERE user_id = $1`, [wingmanUserId])) as Array<{
    id: string;
  }>;
  const wingmanId = wingman[0].id;

  await sql.query(
    `INSERT INTO wingman_event_marks (event_id, wingman_id, mark_type)
     SELECT $1, $2, 'available_in_person'
     WHERE NOT EXISTS (
       SELECT 1 FROM wingman_event_marks WHERE event_id = $1 AND wingman_id = $2 AND mark_type = 'available_in_person'
     )`,
    [eventId, wingmanId],
  );

  const expires = new Date();
  expires.setFullYear(expires.getFullYear() + 1);
  const existingOffer = (await sql.query(
    `SELECT id FROM wingman_event_offers WHERE is_test_fixture = true AND event_id = $1 AND wingman_id = $2 LIMIT 1`,
    [eventId, wingmanId],
  )) as Array<{ id: string }>;
  if (!existingOffer[0]) {
    await sql.query(
      `INSERT INTO wingman_event_offers (
         event_id, wingman_id, service_type, table_package_name, max_group_size,
         minimum_spend_cents, service_fee_cents, taxes_and_fees_cents, arrival_window,
         dress_requirement, age_requirement, cancellation_terms, inventory_quantity,
         expires_at, operator_approved, terms, is_test_fixture
       ) VALUES (
         $1, $2, 'concierge', $3, 4, $4, $5, 0, '11:00 PM TEST window',
         'Venue dress code — not guaranteed', '21+',
         'TEST cancellation: operator may cancel or refund in admin.',
         1, $6::timestamptz, true, $7, true
       )`,
      [
        eventId,
        wingmanId,
        `${TEST_LABEL} concierge evening`,
        TEST_SUBTOTAL_CENTS,
        TEST_SERVICE_FEE_CENTS,
        expires.toISOString(),
        TEST_OFFER_TERMS,
      ],
    );
  }

  await sql.query(
    `INSERT INTO test_fixture_registry (key, entity_type, entity_id, label) VALUES
       ('customer', 'auth_user', $1, $4),
       ('wingman_user', 'auth_user', $2, $4),
       ('event', 'event', $3, $4)
     ON CONFLICT (key) DO UPDATE SET entity_id = EXCLUDED.entity_id`,
    [customerId, wingmanUserId, eventId, TEST_LABEL],
  );

  await sql.query(
    `UPDATE feature_flags SET enabled = true, updated_at = now() WHERE key = 'enable_test_fixtures'`,
  );

  return { seeded: true, removed: false };
}
