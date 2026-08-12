import { NextResponse } from "next/server";
import { z } from "zod";
import { requireOwnerSession } from "@/lib/ai/session";
import {
  getOwnerRevenueTargets,
  setOwnerRevenueTargets,
} from "@/lib/owner/targets";
import { writeAiAuditLog } from "@/lib/ai/audit";
import { recordFounderIntervention } from "@/lib/owner/interventions";

const PatchSchema = z.object({
  monthlyTargetDollars: z.number().finite().min(0).max(1_000_000_000),
  annualTargetDollars: z.number().finite().min(0).max(10_000_000_000),
  notes: z.string().max(2000).optional().nullable(),
});

export async function GET() {
  try {
    await requireOwnerSession();
    const targets = await getOwnerRevenueTargets();
    return NextResponse.json({ targets });
  } catch {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
}

export async function PATCH(request: Request) {
  try {
    const owner = await requireOwnerSession();
    const body = PatchSchema.safeParse(await request.json());
    if (!body.success) {
      return NextResponse.json({ error: "Invalid targets payload." }, { status: 400 });
    }

    const result = await setOwnerRevenueTargets({
      monthlyTargetCents: Math.round(body.data.monthlyTargetDollars * 100),
      annualTargetCents: Math.round(body.data.annualTargetDollars * 100),
      notes: body.data.notes ?? null,
      updatedByProfileId: owner.id,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.reason ?? "Update failed." }, { status: 400 });
    }

    await writeAiAuditLog({
      agentId: "chief_of_staff",
      action: "targets.update",
      permissionLevel: "red",
      actorProfileId: owner.id,
      entityType: "owner_revenue_targets",
      entityId: "default",
      summary: `Set monthly=$${body.data.monthlyTargetDollars} annual=$${body.data.annualTargetDollars}`,
    });

    await recordFounderIntervention({
      interventionType: "targets_update",
      severity: "info",
      summary: `Updated revenue targets to $${body.data.monthlyTargetDollars}/mo and $${body.data.annualTargetDollars}/yr`,
      actorProfileId: owner.id,
      entityType: "owner_revenue_targets",
      entityId: "default",
    });

    const targets = await getOwnerRevenueTargets();
    return NextResponse.json({ ok: true, targets });
  } catch {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
}
