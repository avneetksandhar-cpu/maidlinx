import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { neon } from "@neondatabase/serverless";
import pg from "pg";
import { hashPassword } from "../lib/auth/password";
import { DEFAULT_PERMISSIONS } from "../lib/auth/types";
import { LEGACY_SEED_EMAILS, SEED_ACCOUNTS } from "./seed-accounts";
import { seedLiveSupply } from "./seed-live-supply";
import { seedOrRemoveTestFixtures } from "../lib/test-fixtures/seed";

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

async function main() {
  loadEnvLocal();
  const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is required");
  const seedPassword = process.env.SEED_PASSWORD;
  if (!seedPassword) throw new Error("SEED_PASSWORD is required");

  const sql = neon(url);

  if (LEGACY_SEED_EMAILS.length > 0) {
    await sql.query("DELETE FROM auth_users WHERE email = ANY($1)", [LEGACY_SEED_EMAILS]);
    console.log(`Removed legacy seed emails: ${LEGACY_SEED_EMAILS.join(", ")}`);
  }

  for (const seed of SEED_ACCOUNTS) {
    const hash = hashPassword(seedPassword);
    const existing = (await sql.query("SELECT id FROM auth_users WHERE email = $1 LIMIT 1", [
      seed.email,
    ])) as Array<{ id: string }>;

    if (existing.length > 0) {
      const userId = existing[0].id;
      const client = new pg.Client({
        connectionString: url,
        ssl: { rejectUnauthorized: false },
      });
      await client.connect();
      try {
        await client.query("BEGIN");
        await client.query("SELECT set_config($1, $2, true)", ["app.user_id", userId]);
        await client.query("SELECT set_config($1, $2, true)", ["app.role", "owner"]);
        await client.query(
          "UPDATE auth_users SET password_hash = $1, updated_at = now() WHERE id = $2",
          [hash, userId],
        );
        await client.query(
          `UPDATE profiles
           SET role = $2::user_role,
               membership_tier = 'basic',
               approval_status = 'approved',
               display_name = $3,
               permissions = $4::jsonb,
               updated_at = now()
           WHERE id = $1`,
          [userId, seed.role, seed.name, JSON.stringify(DEFAULT_PERMISSIONS[seed.role])],
        );
        await client.query("DELETE FROM sessions WHERE user_id = $1", [userId]);
        await client.query("COMMIT");
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        await client.end();
      }
      console.log(`Updated ${seed.role}: ${seed.email}`);
      continue;
    }

    await sql.query(
      `SELECT provision_user($1, $2, $3, $4::user_role, 'basic'::membership_tier, 'approved'::approval_status, $5::jsonb)`,
      [seed.email, hash, seed.name, seed.role, JSON.stringify(DEFAULT_PERMISSIONS[seed.role])],
    );
    console.log(`Seeded ${seed.role}: ${seed.email}`);
  }

  const supply = await seedLiveSupply(sql);
  console.log(
    `Live supply imported: ${supply.venues} venues, ${supply.events} discovery events, ${supply.leads} private leads (0 published Wingmen).`,
  );

  const fixtures = await seedOrRemoveTestFixtures(sql);
  if (fixtures.seeded) {
    console.log("Private TEST fixtures seeded (not public). ENABLE_TEST_FIXTURES=true.");
  } else if (fixtures.removed) {
    console.log("Private TEST fixtures removed (ENABLE_TEST_FIXTURES is off).");
  }

  await sql.query(
    `INSERT INTO wingmen (display_name, photo_url, specialties, areas, languages, biography, verification_status)
     SELECT $1, NULL, ARRAY['operator_slot']::text[], ARRAY['Miami']::text[], '{}', $2, 'pending'
     WHERE NOT EXISTS (
       SELECT 1 FROM wingmen
       WHERE 'operator_slot' = ANY(specialties)
          OR (display_name IN ($1, 'Your Wingman', 'Your Wingman · Andres P') AND COALESCE(is_test_fixture, false) = false)
     )`,
    [
      "Andres P",
      "Assigned host / operator. Covers all events for now. Government ID is not verified. No photo. No reviews. More hosts later.",
    ],
  );
  await sql.query(
    `UPDATE wingmen
     SET display_name = $1,
         photo_url = NULL,
         biography = $2,
         verification_status = 'pending',
         updated_at = now()
     WHERE COALESCE(is_test_fixture, false) = false
       AND (
         'operator_slot' = ANY(specialties)
         OR display_name IN ('Your Wingman', 'Your Wingman · Andres P', $1)
       )`,
    [
      "Andres P",
      "Assigned host / operator. Covers all events for now. Government ID is not verified. No photo. No reviews. More hosts later.",
    ],
  );
  console.log("Operator Wingman slot ensured (Andres P, unpublished, not government-ID verified).");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
