import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import pg from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

function loadEnvLocal() {
  const envPath = resolve(process.cwd(), ".env.local");
  try {
    const text = readFileSync(envPath, "utf8");
    for (const line of text.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq);
      const value = trimmed.slice(eq + 1);
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {
    // ignore
  }
}

loadEnvLocal();

const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;

describe.skipIf(!url)("live supply and marketplace tables", () => {
  let client: pg.Client;

  beforeAll(async () => {
    client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
    await client.connect();
  });

  afterAll(async () => {
    await client.end();
  });

  it("has event sync tables without inventing bookable inventory", async () => {
    const sources = await client.query<{ n: number }>(
      `SELECT count(*)::int AS n FROM event_sources`,
    );
    const partner = await client.query<{ enabled: boolean }>(
      `SELECT enabled FROM event_sources WHERE slug = 'partner_feed'`,
    );
    expect(sources.rows[0].n).toBe(6);
    expect(partner.rows[0]?.enabled).toBe(false);
  });

  it("has discovery events and zero bookable offers", async () => {
    const events = await client.query<{ n: number }>(
      `SELECT count(*)::int AS n FROM events
       WHERE discovery_status IN ('discovery_ready', 'bookable')
         AND COALESCE(is_test_fixture, false) = false`,
    );
    const bookable = await client.query<{ n: number }>(
      `SELECT count(*)::int AS n FROM wingman_event_offers
       WHERE bookable = true AND COALESCE(is_test_fixture, false) = false`,
    );
    expect(events.rows[0].n).toBeGreaterThan(0);
    expect(bookable.rows[0].n).toBe(0);
  });

  it("keeps recruitment leads private and unpublished", async () => {
    const leads = await client.query<{ n: number; visible: number }>(
      `SELECT count(*)::int AS n,
              count(*) FILTER (WHERE production_visible)::int AS visible
       FROM wingman_applications
       WHERE COALESCE(is_test_fixture, false) = false`,
    );
    const publicWingmen = await client.query<{ n: number }>(
      `SELECT count(*)::int AS n FROM wingmen
       WHERE verification_status = 'verified' AND COALESCE(is_test_fixture, false) = false`,
    );
    expect(leads.rows[0].n).toBe(10);
    expect(leads.rows[0].visible).toBe(0);
    expect(publicWingmen.rows[0].n).toBe(0);
  });

  it("has an interest waitlist table that starts empty of access promises", async () => {
    const interest = await client.query<{ n: number }>(
      `SELECT count(*)::int AS n FROM interest_signups`,
    );
    expect(interest.rows[0].n).toBeGreaterThanOrEqual(0);
    const columns = await client.query<{ column_name: string }>(
      `SELECT column_name FROM information_schema.columns
       WHERE table_name = 'interest_signups' AND column_name IN ('email', 'source')`,
    );
    expect(columns.rows.map((row) => row.column_name).sort()).toEqual(["email", "source"]);
  });

  it("keeps TEST fixtures invisible to public inventory queries", async () => {
    const publicEvents = await client.query<{ n: number }>(
      `SELECT count(*)::int AS n FROM events
       WHERE COALESCE(is_test_fixture, false) = true
         AND discovery_status IN ('discovery_ready', 'bookable')
         AND hidden_at IS NULL`,
    );
    const publicOffers = await client.query<{ n: number }>(
      `SELECT count(*)::int AS n FROM wingman_event_offers o
       JOIN events e ON e.id = o.event_id
       WHERE o.bookable = true
         AND COALESCE(o.is_test_fixture, false) = false`,
    );
    const publicWingmen = await client.query<{ n: number }>(
      `SELECT count(*)::int AS n FROM wingmen
       WHERE verification_status = 'verified' AND COALESCE(is_test_fixture, false) = false`,
    );
    expect(publicEvents.rows[0].n).toBe(0);
    expect(publicOffers.rows[0].n).toBe(0);
    expect(publicWingmen.rows[0].n).toBe(0);
  });

  it("hides applications from the non-bypass role without operator context", async () => {
    await client.query("BEGIN");
    try {
      await client.query("SET LOCAL ROLE wingman_rls");
      await client.query("SELECT set_config($1, $2, true)", ["app.role", "member"]);
      const visible = await client.query(
        "SELECT id FROM wingman_applications WHERE COALESCE(is_test_fixture, false) = false",
      );
      expect(visible.rows).toHaveLength(0);
    } finally {
      await client.query("ROLLBACK");
    }
  });
});
