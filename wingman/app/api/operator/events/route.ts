import { NextResponse } from "next/server";
import { isResponse, jsonError, requireOperator } from "@/lib/api/http";
import { listOperatorEvents, mergeOperatorEvents, unmergeOperatorEvent, updateOperatorEvent } from "@/lib/events/ops";

export const runtime = "nodejs";

export async function GET() {
  const user = await requireOperator();
  if (isResponse(user)) return user;
  const data = await listOperatorEvents(user);
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const user = await requireOperator();
  if (isResponse(user)) return user;
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return jsonError("Invalid request.", 400);
  }
  const action = String(body.action ?? "");
  try {
    if (action === "update" || action === "approve" || action === "reject" || action === "cancel") {
      await updateOperatorEvent(user, {
        eventId: String(body.eventId),
        name: body.name ? String(body.name) : undefined,
        officialSourceUrl: body.officialSourceUrl ? String(body.officialSourceUrl) : undefined,
        neighborhood: body.neighborhood ? String(body.neighborhood) : undefined,
        atmosphere: body.atmosphere ? String(body.atmosphere) : undefined,
        dressCode: body.dressCode ? String(body.dressCode) : undefined,
        estimatedSpendText: body.estimatedSpendText ? String(body.estimatedSpendText) : undefined,
        ageRequirement: body.ageRequirement ? String(body.ageRequirement) : undefined,
        musicGenre: body.musicGenre ? String(body.musicGenre) : undefined,
        internalNotes: body.internalNotes ? String(body.internalNotes) : undefined,
        importStatus:
          action === "approve" ? "approved" : action === "reject" ? "rejected" : undefined,
        cancel: action === "cancel",
        cancelReason: body.cancelReason ? String(body.cancelReason) : undefined,
      });
      return NextResponse.json({ ok: true });
    }
    if (action === "merge") {
      await mergeOperatorEvents(user, String(body.keepId), String(body.dropId));
      return NextResponse.json({ ok: true });
    }
    if (action === "unmerge") {
      const id = await unmergeOperatorEvent(
        user,
        String(body.eventId),
        String(body.sourceSlug),
        String(body.externalId),
      );
      return NextResponse.json({ ok: true, eventId: id });
    }
    return jsonError("Unknown action.", 400);
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Action failed.", 400);
  }
}
