import { neon } from "@neondatabase/serverless";

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing ${name}.`);
  }
  return value;
}

export function getDatabaseUrl(): string {
  return process.env.DATABASE_URL_UNPOOLED || requiredEnv("DATABASE_URL");
}

let sqlClient: ReturnType<typeof neon> | undefined;

export function getSql() {
  if (!sqlClient) {
    sqlClient = neon(getDatabaseUrl());
  }
  return sqlClient;
}
