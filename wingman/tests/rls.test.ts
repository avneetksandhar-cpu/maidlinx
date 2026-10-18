import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import pg from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { hashPassword } from "@/lib/auth/password";
import { DEFAULT_PERMISSIONS } from "@/lib/auth/types";

function loadEnvLocal() {
  const envPath = resolve(process.cwd(), ".env.local");
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
}

loadEnvLocal();

const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;

const memberEmail = `rls.member.${Date.now()}@wingman.test`;
const otherEmail = `rls.other.${Date.now()}@wingman.test`;
let memberId = "";
let otherId = "";
let client: pg.Client | null = null;

describe.skipIf(!url)("row-level security on profiles", () => {
  beforeAll(async () => {
    client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
    await client.connect();
    const password = hashPassword("RlsTestPass1!");
    const member = await client.query<{ id: string }>(
      `SELECT provision_user($1, $2, $3, 'member'::user_role, 'basic'::membership_tier, 'approved'::approval_status, $4::jsonb) AS id`,
      [memberEmail, password, "RLS Member", JSON.stringify(DEFAULT_PERMISSIONS.member)],
    );
    const other = await client.query<{ id: string }>(
      `SELECT provision_user($1, $2, $3, 'member'::user_role, 'basic'::membership_tier, 'approved'::approval_status, $4::jsonb) AS id`,
      [otherEmail, password, "RLS Other", JSON.stringify(DEFAULT_PERMISSIONS.member)],
    );
    memberId = member.rows[0].id;
    otherId = other.rows[0].id;
  });

  afterAll(async () => {
    if (!client) return;
    await client.query("DELETE FROM auth_users WHERE email = ANY($1)", [[memberEmail, otherEmail]]);
    await client.end();
  });

  it("returns no profiles for the non-bypass role without a user context", async () => {
    await client!.query("BEGIN");
    try {
      await client!.query("SET LOCAL ROLE wingman_rls");
      const visible = await client!.query("SELECT id FROM profiles WHERE id = ANY($1)", [
        [memberId, otherId],
      ]);
      expect(visible.rows).toHaveLength(0);
    } finally {
      await client!.query("ROLLBACK");
    }
  });

  it("hides other profiles from a member context", async () => {
    await client!.query("BEGIN");
    try {
      await client!.query("SET LOCAL ROLE wingman_rls");
      await client!.query("SELECT set_config($1, $2, true)", ["app.user_id", memberId]);
      await client!.query("SELECT set_config($1, $2, true)", ["app.role", "member"]);
      const visible = await client!.query("SELECT id FROM profiles ORDER BY created_at");
      expect(visible.rows.map((row) => row.id)).toEqual([memberId]);
    } finally {
      await client!.query("ROLLBACK");
    }
  });

  it("lets owner context read the test profiles", async () => {
    await client!.query("BEGIN");
    try {
      await client!.query("SET LOCAL ROLE wingman_rls");
      await client!.query("SELECT set_config($1, $2, true)", ["app.user_id", memberId]);
      await client!.query("SELECT set_config($1, $2, true)", ["app.role", "owner"]);
      const visible = await client!.query("SELECT id FROM profiles WHERE id = ANY($1)", [
        [memberId, otherId],
      ]);
      expect(visible.rows).toHaveLength(2);
    } finally {
      await client!.query("ROLLBACK");
    }
  });

  it("blocks members from changing their role", async () => {
    await client!.query("BEGIN");
    try {
      await client!.query("SET LOCAL ROLE wingman_rls");
      await client!.query("SELECT set_config($1, $2, true)", ["app.user_id", memberId]);
      await client!.query("SELECT set_config($1, $2, true)", ["app.role", "member"]);
      await expect(
        client!.query("UPDATE profiles SET role = 'owner' WHERE id = $1", [memberId]),
      ).rejects.toThrow();
    } finally {
      await client!.query("ROLLBACK");
    }
  });
});
