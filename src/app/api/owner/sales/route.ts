import { NextResponse } from "next/server";
import { z } from "zod";
import { requireOwnerSession } from "@/lib/ai/session";
import {
  createSalesLead,
  listSalesLeads,
  updateSalesLead,
  SALES_STAGES,
} from "@/lib/owner/sales";
import { writeAiAuditLog } from "@/lib/ai/audit";

const CreateSchema = z.object({
  companyName: z.string().trim().min(1).max(200),
  contactName: z.string().trim().max(200).optional().nullable(),
  contactEmail: z
    .union([z.string().trim().email(), z.literal("")])
    .optional()
    .nullable(),
  contactPhone: z.string().trim().max(40).optional().nullable(),
  segment: z
    .enum(["commercial", "property_manager", "office", "airbnb", "other"])
    .optional(),
  stage: z.enum(SALES_STAGES).optional(),
  estimatedMonthlyCents: z.number().int().min(0).optional().nullable(),
  nextFollowUpAt: z.string().datetime().optional().nullable(),
  ownerNotes: z.string().max(4000).optional().nullable(),
  source: z.string().max(80).optional().nullable(),
});

const PatchSchema = z.object({
  id: z.string().uuid(),
  stage: z.enum(SALES_STAGES).optional(),
  status: z.enum(["open", "won", "lost", "archived"]).optional(),
  nextFollowUpAt: z.string().datetime().optional().nullable(),
  lastContactedAt: z.string().datetime().optional().nullable(),
  ownerNotes: z.string().max(4000).optional().nullable(),
  estimatedMonthlyCents: z.number().int().min(0).optional().nullable(),
});

export async function GET() {
  try {
    await requireOwnerSession();
    const leads = await listSalesLeads(100);
    return NextResponse.json(leads);
  } catch {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    const owner = await requireOwnerSession();
    const body = CreateSchema.safeParse(await request.json());
    if (!body.success) {
      return NextResponse.json({ error: "Invalid lead payload." }, { status: 400 });
    }

    const result = await createSalesLead({
      ...body.data,
      contactEmail: body.data.contactEmail || null,
      createdByProfileId: owner.id,
    });

    if (!result.id) {
      return NextResponse.json({ error: result.reason ?? "Create failed." }, { status: 400 });
    }

    await writeAiAuditLog({
      agentId: "b2b_sales_director",
      action: "sales.lead_create",
      permissionLevel: "green",
      actorProfileId: owner.id,
      entityType: "owner_sales_lead",
      entityId: result.id,
      summary: `Created lead ${body.data.companyName}`,
    });

    return NextResponse.json({ ok: true, id: result.id });
  } catch {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
}

export async function PATCH(request: Request) {
  try {
    const owner = await requireOwnerSession();
    const body = PatchSchema.safeParse(await request.json());
    if (!body.success) {
      return NextResponse.json({ error: "Invalid patch payload." }, { status: 400 });
    }

    const { id, ...patch } = body.data;
    const result = await updateSalesLead({ id, ...patch });
    if (!result.ok) {
      return NextResponse.json({ error: result.reason ?? "Update failed." }, { status: 400 });
    }

    await writeAiAuditLog({
      agentId: "b2b_sales_director",
      action: "sales.lead_update",
      permissionLevel: "green",
      actorProfileId: owner.id,
      entityType: "owner_sales_lead",
      entityId: id,
      summary: `Updated lead ${id}`,
      metadata: patch,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
}
