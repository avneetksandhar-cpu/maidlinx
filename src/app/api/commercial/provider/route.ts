import { NextResponse } from "next/server";
import { z } from "zod";
import { requireProfessionalSession } from "@/lib/pro/dashboard/session";
import {
  getCommercialProviderProfile,
  upsertCommercialProviderProfile,
} from "@/lib/commercial/provider";
import { listOpenOpportunitiesForProvider } from "@/lib/commercial/proposals";
import { createAdminClient } from "@/lib/supabase/admin";

async function cleanerIdForProfile(userId: string): Promise<string | null> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("cleaners")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();
  return data ? String((data as { id: string }).id) : null;
}

export async function GET(request: Request) {
  try {
    const { profile } = await requireProfessionalSession();
    const cleanerId = await cleanerIdForProfile(profile.id);
    if (!cleanerId) {
      return NextResponse.json({ error: "Cleaner profile required." }, { status: 400 });
    }
    const view = new URL(request.url).searchParams.get("view") ?? "setup";
    if (view === "opportunities") {
      const opportunities = await listOpenOpportunitiesForProvider(cleanerId);
      return NextResponse.json({ data: { opportunities } });
    }
    const provider = await getCommercialProviderProfile(cleanerId);
    return NextResponse.json({ data: { provider } });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to load provider." },
      { status: 400 },
    );
  }
}

const PutSchema = z.object({
  serviceArea: z.string().trim().min(1).max(200),
  specialties: z.array(z.string().trim().min(1).max(80)).min(1).max(12),
  availableHours: z.string().trim().min(1).max(200),
  markComplete: z.boolean().optional(),
});

export async function PUT(request: Request) {
  try {
    const { profile } = await requireProfessionalSession();
    const cleanerId = await cleanerIdForProfile(profile.id);
    if (!cleanerId) {
      return NextResponse.json({ error: "Cleaner profile required." }, { status: 400 });
    }
    const body = PutSchema.safeParse(await request.json());
    if (!body.success) {
      return NextResponse.json(
        { error: body.error.errors[0]?.message ?? "Invalid provider setup." },
        { status: 400 },
      );
    }
    const provider = await upsertCommercialProviderProfile({
      cleanerId,
      ...body.data,
    });
    return NextResponse.json({ data: { provider } });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to save setup." },
      { status: 400 },
    );
  }
}
