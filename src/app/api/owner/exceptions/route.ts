import { NextResponse } from "next/server";
import { z } from "zod";
import { requireOwnerSession } from "@/lib/ai/session";
import {
  listOpenAiExceptions,
  updateAiExceptionStatus,
} from "@/lib/owner/exceptions";
import { writeAiAuditLog } from "@/lib/ai/audit";
import { recordFounderIntervention } from "@/lib/owner/interventions";

const PatchSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["open", "acknowledged", "resolved", "ignored"]),
});

export async function GET() {
  try {
    await requireOwnerSession();
    const inbox = await listOpenAiExceptions(100);
    return NextResponse.json(inbox);
  } catch {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
}

export async function PATCH(request: Request) {
  try {
    const owner = await requireOwnerSession();
    const body = PatchSchema.safeParse(await request.json());
    if (!body.success) {
      return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
    }

    const result = await updateAiExceptionStatus(body.data);
    if (!result.ok) {
      return NextResponse.json({ error: result.reason ?? "Update failed." }, { status: 400 });
    }

    await writeAiAuditLog({
      agentId: "ops_director",
      action: "exception.update",
      permissionLevel: "yellow",
      actorProfileId: owner.id,
      entityType: "ai_exception",
      entityId: body.data.id,
      summary: `Set exception ${body.data.id} → ${body.data.status}`,
    });

    if (body.data.status === "resolved" || body.data.status === "ignored") {
      await recordFounderIntervention({
        interventionType: "exception_triage",
        severity: "info",
        summary: `Founder marked exception ${body.data.status}`,
        actorProfileId: owner.id,
        entityType: "ai_exception",
        entityId: body.data.id,
        relatedExceptionId: body.data.id,
      });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
}
