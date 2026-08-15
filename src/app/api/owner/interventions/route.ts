import { NextResponse } from "next/server";
import { z } from "zod";
import { requireOwnerSession } from "@/lib/ai/session";
import {
  listFounderInterventions,
  recordFounderIntervention,
  getInterventionWeeklyTrend,
} from "@/lib/owner/interventions";

const CreateSchema = z.object({
  interventionType: z.string().trim().min(1).max(80),
  summary: z.string().trim().min(1).max(2000),
  severity: z.enum(["info", "warning", "critical"]).optional(),
  entityType: z.string().max(80).optional().nullable(),
  entityId: z.string().max(120).optional().nullable(),
});

export async function GET() {
  try {
    await requireOwnerSession();
    const [items, trend] = await Promise.all([
      listFounderInterventions(40),
      getInterventionWeeklyTrend(8),
    ]);
    return NextResponse.json({ items, trend });
  } catch {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    const owner = await requireOwnerSession();
    const body = CreateSchema.safeParse(await request.json());
    if (!body.success) {
      return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
    }

    const result = await recordFounderIntervention({
      ...body.data,
      actorProfileId: owner.id,
    });

    if (!result.id) {
      return NextResponse.json({ error: result.reason ?? "Create failed." }, { status: 400 });
    }

    return NextResponse.json({ ok: true, id: result.id });
  } catch {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
}
