import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminSessionOrNull } from "@/lib/admin/session";
import {
  assignOpsFollowUp,
  getOrderContribution,
  listOpsDesk,
  resolveOpsCase,
} from "@/lib/commercial/ops";

export async function GET() {
  try {
    const admin = await getAdminSessionOrNull();
    if (!admin) {
      return NextResponse.json({ error: "Admin required." }, { status: 401 });
    }
    const desk = await listOpsDesk();
    return NextResponse.json({ data: desk });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to load ops desk." },
      { status: 400 },
    );
  }
}

const PatchSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("resolve"),
    caseId: z.string().uuid(),
    resolutionNotes: z.string().trim().min(1).max(2000),
    followUpOwnerUserId: z.string().uuid().optional().nullable(),
  }),
  z.object({
    action: z.literal("assign"),
    caseId: z.string().uuid(),
    followUpOwnerUserId: z.string().uuid(),
  }),
  z.object({
    action: z.literal("contribution"),
    orderId: z.string().uuid(),
  }),
]);

export async function PATCH(request: Request) {
  try {
    const admin = await getAdminSessionOrNull();
    if (!admin) {
      return NextResponse.json({ error: "Admin required." }, { status: 401 });
    }
    const body = PatchSchema.safeParse(await request.json());
    if (!body.success) {
      return NextResponse.json(
        { error: body.error.errors[0]?.message ?? "Invalid ops action." },
        { status: 400 },
      );
    }

    if (body.data.action === "contribution") {
      const contribution = await getOrderContribution(body.data.orderId);
      return NextResponse.json({ data: { contribution } });
    }

    if (body.data.action === "assign") {
      const opsCase = await assignOpsFollowUp({
        caseId: body.data.caseId,
        followUpOwnerUserId: body.data.followUpOwnerUserId,
      });
      return NextResponse.json({ data: { case: opsCase } });
    }

    const opsCase = await resolveOpsCase({
      caseId: body.data.caseId,
      adminUserId: admin.id,
      resolutionNotes: body.data.resolutionNotes,
      followUpOwnerUserId: body.data.followUpOwnerUserId,
    });
    return NextResponse.json({ data: { case: opsCase } });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to update ops case." },
      { status: 400 },
    );
  }
}
