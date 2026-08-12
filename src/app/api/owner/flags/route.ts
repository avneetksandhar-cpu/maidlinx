import { NextResponse } from "next/server";
import { z } from "zod";
import { requireOwnerSession } from "@/lib/ai/session";
import { AI_FLAG_KEYS, listAiFeatureFlags, setAiFlag } from "@/lib/ai/flags";
import { writeAiAuditLog } from "@/lib/ai/audit";

const PatchSchema = z.object({
  key: z.enum(AI_FLAG_KEYS),
  enabled: z.boolean(),
});

export async function GET() {
  try {
    await requireOwnerSession();
    const flags = await listAiFeatureFlags();
    return NextResponse.json({ flags });
  } catch {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
}

export async function PATCH(request: Request) {
  try {
    const owner = await requireOwnerSession();
    const body = PatchSchema.safeParse(await request.json());
    if (!body.success) {
      return NextResponse.json({ error: "Invalid flag payload." }, { status: 400 });
    }

    const result = await setAiFlag({
      key: body.data.key,
      enabled: body.data.enabled,
      updatedByProfileId: owner.id,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.reason ?? "Update failed." }, { status: 400 });
    }

    await writeAiAuditLog({
      agentId: "chief_of_staff",
      action: "flag.update",
      permissionLevel: "red",
      actorProfileId: owner.id,
      entityType: "ai_feature_flag",
      entityId: body.data.key,
      summary: `Set ${body.data.key}=${body.data.enabled}`,
      metadata: { key: body.data.key, enabled: body.data.enabled },
    });

    const flags = await listAiFeatureFlags();
    return NextResponse.json({ ok: true, flags });
  } catch {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
}
