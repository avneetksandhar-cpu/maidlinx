import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import pg from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { hashPassword } from "@/lib/auth/password";
import { DEFAULT_PERMISSIONS } from "@/lib/auth/types";

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
const ownerEmail = `acct.owner.${Date.now()}@wingman.test`;
const strangerEmail = `acct.stranger.${Date.now()}@wingman.test`;

describe.skipIf(!url)("account booking ownership", () => {
  let client: pg.Client;
  let ownerId = "";
  let strangerId = "";
  let requestId = "";

  beforeAll(async () => {
    client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
    await client.connect();
    const password = hashPassword("AcctTestPass1!");
    const owner = await client.query<{ id: string }>(
      `SELECT provision_user($1, $2, $3, 'member'::user_role, 'basic'::membership_tier, 'approved'::approval_status, $4::jsonb) AS id`,
      [ownerEmail, password, "Account Owner", JSON.stringify(DEFAULT_PERMISSIONS.member)],
    );
    const stranger = await client.query<{ id: string }>(
      `SELECT provision_user($1, $2, $3, 'member'::user_role, 'basic'::membership_tier, 'approved'::approval_status, $4::jsonb) AS id`,
      [strangerEmail, password, "Account Stranger", JSON.stringify(DEFAULT_PERMISSIONS.member)],
    );
    ownerId = owner.rows[0].id;
    strangerId = stranger.rows[0].id;
    const inserted = await client.query<{ id: string }>(
      `INSERT INTO booking_requests (
         customer_id, source, occasion, atmosphere, area, starts_at, group_size, spend_band, status
       ) VALUES (
         $1, 'night_service', 'Ownership night', 'Nightlife', 'Miami', now() + interval '1 day',
         2, 'band_500_1500', 'draft'
       ) RETURNING id`,
      [ownerId],
    );
    requestId = inserted.rows[0].id;
  });

  afterAll(async () => {
    if (!client) return;
    await client.query("DELETE FROM booking_requests WHERE id = $1", [requestId]);
    await client.query("DELETE FROM auth_users WHERE email = ANY($1)", [[ownerEmail, strangerEmail]]);
    await client.end();
  });

  it("lets the customer see their booking and hides it from another member", async () => {
    await client.query("BEGIN");
    try {
      await client.query("SET LOCAL ROLE wingman_rls");
      await client.query("SELECT set_config($1, $2, true)", ["app.user_id", ownerId]);
      await client.query("SELECT set_config($1, $2, true)", ["app.role", "member"]);
      const own = await client.query("SELECT id FROM booking_requests WHERE id = $1", [requestId]);
      expect(own.rows).toHaveLength(1);
    } finally {
      await client.query("ROLLBACK");
    }

    await client.query("BEGIN");
    try {
      await client.query("SET LOCAL ROLE wingman_rls");
      await client.query("SELECT set_config($1, $2, true)", ["app.user_id", strangerId]);
      await client.query("SELECT set_config($1, $2, true)", ["app.role", "member"]);
      const hidden = await client.query("SELECT id FROM booking_requests WHERE id = $1", [requestId]);
      expect(hidden.rows).toHaveLength(0);
    } finally {
      await client.query("ROLLBACK");
    }
  });
});
