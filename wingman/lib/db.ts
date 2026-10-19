import pg from "pg";
import type { UserRole } from "@/lib/auth/types";
import { getDatabaseUrl, getSql } from "@/lib/neon";

export { getDatabaseUrl, getSql };

let pool: pg.Pool | undefined;

export function getPool(): pg.Pool {
  if (!pool) {
    pool = new pg.Pool({
      connectionString: getDatabaseUrl(),
      max: 5,
      ssl: { rejectUnauthorized: false },
    });
  }
  return pool;
}

export async function withUserContext<T>(
  user: { id: string; role: UserRole },
  fn: (client: pg.PoolClient) => Promise<T>,
): Promise<T> {
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT set_config($1, $2, true)", ["app.user_id", user.id]);
    await client.query("SELECT set_config($1, $2, true)", ["app.role", user.role]);
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
