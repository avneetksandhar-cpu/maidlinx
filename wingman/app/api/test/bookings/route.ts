import { NextResponse } from "next/server";
import { isResponse, jsonError, requireSession } from "@/lib/api/http";
import { createPrivateTestRequest } from "@/lib/marketplace/test-booking";
import { SERVICE_DISCLAIMER, containsForbiddenServiceRequest } from "@/lib/marketplace/services";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const user = await requireSession();
  if (isResponse(user)) return user;
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return jsonError("Invalid request.", 400);
  }
  if (containsForbiddenServiceRequest(String(body.occasion ?? "") + " " + String(body.atmosphere ?? ""))) {
    return jsonError(SERVICE_DISCLAIMER, 400);
  }
  try {
    const created = await createPrivateTestRequest(user, {
      serviceScopeAck: Boolean(body.serviceScopeAck),
      codeOfConductAck: Boolean(body.codeOfConductAck),
      noGuaranteesAck: Boolean(body.noGuaranteesAck),
      emergencyContactName: String(body.emergencyContactName ?? ""),
      emergencyContactPhone: String(body.emergencyContactPhone ?? ""),
      occasion: body.occasion ? String(body.occasion) : undefined,
      atmosphere: body.atmosphere ? String(body.atmosphere) : undefined,
      groupSize: body.groupSize != null ? Number(body.groupSize) : undefined,
    });
    return NextResponse.json({ ok: true, ...created, status: "draft" });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Could not create TEST request.", 400);
  }
}
