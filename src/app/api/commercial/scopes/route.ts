import { NextResponse } from "next/server";
import { z } from "zod";
import { requireCustomerSession } from "@/lib/dashboard/session";
import { getScopeForSite, upsertSiteScope } from "@/lib/commercial/scopes";
import { COMMERCIAL_AREAS, SERVICE_DAYS } from "@/lib/commercial/types";

const UpsertSchema = z.object({
  siteAddressId: z.string().uuid(),
  areas: z.array(z.enum(COMMERCIAL_AREAS)).min(1),
  frequency: z.enum(["one_time", "weekly", "biweekly", "monthly", "custom"]),
  serviceDays: z.array(z.enum(SERVICE_DAYS)).default([]),
  serviceWindow: z.string().trim().max(200).optional().nullable(),
  startDate: z.string().trim().max(32).optional().nullable(),
  squareFootage: z.number().int().nonnegative().optional().nullable(),
  siteContact: z.string().trim().max(200).optional().nullable(),
  accessNotes: z.string().trim().max(2000).optional().nullable(),
  companyName: z.string().trim().max(200).optional().nullable(),
});

export async function GET(request: Request) {
  try {
    const { profile } = await requireCustomerSession();
    const siteAddressId = new URL(request.url).searchParams.get("siteAddressId");
    if (!siteAddressId) {
      return NextResponse.json({ error: "siteAddressId required" }, { status: 400 });
    }
    const scope = await getScopeForSite({
      siteAddressId,
      userId: profile.id,
    });
    return NextResponse.json({ data: { scope } });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to load scope." },
      { status: 400 },
    );
  }
}

export async function PUT(request: Request) {
  try {
    const { profile } = await requireCustomerSession();
    const body = UpsertSchema.safeParse(await request.json());
    if (!body.success) {
      return NextResponse.json(
        { error: body.error.errors[0]?.message ?? "Invalid scope." },
        { status: 400 },
      );
    }
    const scope = await upsertSiteScope({
      userId: profile.id,
      ...body.data,
    });
    return NextResponse.json({ data: { scope } });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to save scope." },
      { status: 400 },
    );
  }
}
