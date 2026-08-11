import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({ error: "Clerk webhooks removed. Use Supabase Auth." }, { status: 410 });
}
