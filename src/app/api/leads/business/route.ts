import { NextResponse } from "next/server";
import { z } from "zod";
import { createSalesLead } from "@/lib/owner/sales";
import { writeAiAuditLog } from "@/lib/ai/audit";

/**
 * Public B2B lead capture → owner_sales_leads CRM.
 * No auth. Does not invent pipeline dollars. Stripe untouched.
 */
const PublicLeadSchema = z.object({
  companyName: z.string().trim().min(1).max(200),
  contactName: z.string().trim().max(200).optional().nullable(),
  contactEmail: z.string().trim().email().max(200),
  contactPhone: z.string().trim().max(40).optional().nullable(),
  segment: z
    .enum(["commercial", "property_manager", "office", "airbnb", "other"])
    .optional()
    .default("commercial"),
  notes: z.string().trim().max(2000).optional().nullable(),
  /** Honeypot — bots fill this; humans leave empty. */
  website: z.string().max(200).optional().nullable(),
});

export async function POST(request: Request) {
  try {
    const raw = await request.json();
    // Silent accept for honeypot fills (do not create a lead).
    if (typeof raw?.website === "string" && raw.website.trim().length > 0) {
      return NextResponse.json({ ok: true });
    }

    const body = PublicLeadSchema.safeParse(raw);
    if (!body.success) {
      return NextResponse.json(
        { error: body.error.errors[0]?.message ?? "Invalid lead payload." },
        { status: 400 },
      );
    }

    const result = await createSalesLead({
      companyName: body.data.companyName,
      contactName: body.data.contactName ?? null,
      contactEmail: body.data.contactEmail,
      contactPhone: body.data.contactPhone ?? null,
      segment: body.data.segment,
      stage: "lead",
      ownerNotes: body.data.notes ?? null,
      source: "for-business-web",
    });

    if (!result.id) {
      return NextResponse.json(
        { error: result.reason ?? "Unable to save lead." },
        { status: 400 },
      );
    }

    await writeAiAuditLog({
      agentId: "b2b_sales_director",
      action: "sales.lead_create_public",
      permissionLevel: "green",
      actorProfileId: null,
      entityType: "owner_sales_lead",
      entityId: result.id,
      summary: `Public B2B lead ${body.data.companyName}`,
    });

    return NextResponse.json({ ok: true, id: result.id });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Create failed." },
      { status: 500 },
    );
  }
}
