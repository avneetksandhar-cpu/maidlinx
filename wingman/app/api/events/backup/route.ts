import { jsonError } from "@/lib/api/http";
import { pickBackupListing } from "@/lib/marketplace/backup";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const backup = await pickBackupListing({
      id: url.searchParams.get("exclude") || url.searchParams.get("excludeId"),
      externalId: url.searchParams.get("excludeExternalId"),
      venueName: url.searchParams.get("excludeVenue"),
    });
    return NextResponse.json({
      backup,
      note: backup
        ? "Second discovery listing shown as a backup estimate. Not a partnership."
        : "No second discovery listing to show as backup. We will not invent a venue.",
      partnershipClaimed: false,
      stripeMode: "test",
    });
  } catch {
    return jsonError("Backup listings are unavailable right now.", 503);
  }
}
