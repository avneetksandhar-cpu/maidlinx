import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api/http";
import {
  ASSIGNED_HOST_NAME,
  MORE_WINGMEN_NOTE,
  YOUR_WINGMAN_DISPLAY_NAME,
} from "@/lib/marketplace/host-copy";
import { publicWingmanPayload } from "@/lib/marketplace/verification";
import { listPublicWingmen } from "@/lib/marketplace/service";

export const runtime = "nodejs";

export async function GET() {
  try {
    const rows = await listPublicWingmen();
    return NextResponse.json({
      wingmen: rows.map((row) => publicWingmanPayload(row)),
      count: rows.length,
      operatorAssignment: {
        hostName: ASSIGNED_HOST_NAME,
        displayName: YOUR_WINGMAN_DISPLAY_NAME,
        unpublished: true,
        publicVerified: false,
        governmentIdVerified: false,
        photoUrl: null,
        reviews: [],
        note: MORE_WINGMEN_NOTE,
      },
      note:
        rows.length === 0
          ? "No verified public Wingmen. Assigned host is Andres P — not a government-ID-verified marketplace profile."
          : null,
    });
  } catch {
    return jsonError("Wingmen directory is unavailable right now.", 503);
  }
}
