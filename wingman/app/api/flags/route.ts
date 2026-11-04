import { NextResponse } from "next/server";
import { getSql } from "@/lib/neon";

export const runtime = "nodejs";

export async function GET() {
  const sql = getSql();
  const rows = (await sql`SELECT key, enabled, notes FROM feature_flags ORDER BY key`) as Array<{
    key: string;
    enabled: boolean;
    notes: string | null;
  }>;
  return NextResponse.json({ flags: rows });
}
