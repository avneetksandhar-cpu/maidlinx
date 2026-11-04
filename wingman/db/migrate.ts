import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { neon } from "@neondatabase/serverless";

function splitSqlStatements(sql: string): string[] {
  const statements: string[] = [];
  let current = "";
  let inDollar = false;

  for (let i = 0; i < sql.length; i += 1) {
    if (sql.startsWith("$$", i)) {
      inDollar = !inDollar;
      current += "$$";
      i += 1;
      continue;
    }
    if (!inDollar && sql[i] === ";") {
      const withoutComments = current
        .split("\n")
        .filter((line) => !line.trim().startsWith("--"))
        .join("\n")
        .trim();
      if (withoutComments) statements.push(withoutComments);
      current = "";
      continue;
    }
    current += sql[i];
  }

  const trailing = current
    .split("\n")
    .filter((line) => !line.trim().startsWith("--"))
    .join("\n")
    .trim();
  if (trailing) statements.push(trailing);
  return statements;
}

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
    // env may already be injected
  }
}

async function main() {
  loadEnvLocal();
  const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is required");
  }

  const sql = neon(url);
  const dir = resolve(process.cwd(), "db/migrations");
  const files = readdirSync(dir)
    .filter((name) => name.endsWith(".sql"))
    .sort();

  for (const file of files) {
    const statements = splitSqlStatements(readFileSync(resolve(dir, file), "utf8"));
    for (const statement of statements) {
      await sql.query(statement, []);
    }
    console.log(`Applied ${statements.length} statements from ${file}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
