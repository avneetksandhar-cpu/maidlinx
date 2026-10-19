import { NextResponse } from "next/server";
import { isResponse, jsonError, requireSession } from "@/lib/api/http";
import { clientKey, rateLimit } from "@/lib/security/rate-limit";
import { submitVenueApplication } from "@/lib/venues/service";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const limited = rateLimit({ key: clientKey(request, "venue-apply"), limit: 8, windowMs: 60_000 });
  if (!limited.ok) return jsonError("Too many applications. Try again shortly.", 429);
  const user = await requireSession();
  if (isResponse(user)) return user;
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return jsonError("Invalid request.", 400);
  }
  try {
    const result = await submitVenueApplication(user.id, {
      venueName: String(body.venueName ?? ""),
      venueType: String(body.venueType ?? ""),
      address: String(body.address ?? ""),
      neighborhood: String(body.neighborhood ?? ""),
      city: body.city ? String(body.city) : "Miami",
      website: body.website ? String(body.website) : undefined,
      instagram: body.instagram ? String(body.instagram) : undefined,
      contactName: String(body.contactName ?? ""),
      contactTitle: String(body.contactTitle ?? ""),
      businessEmail: String(body.businessEmail ?? ""),
      phone: String(body.phone ?? ""),
      legalName: String(body.legalName ?? ""),
      licenseNumber: String(body.licenseNumber ?? ""),
      hoursText: String(body.hoursText ?? ""),
      description: String(body.description ?? ""),
      musicGenres: String(body.musicGenres ?? ""),
      dressCode: String(body.dressCode ?? ""),
      guestProfile: body.guestProfile ? String(body.guestProfile) : undefined,
      reservationUrl: body.reservationUrl ? String(body.reservationUrl) : undefined,
      ticketUrl: body.ticketUrl ? String(body.ticketUrl) : undefined,
      tableMinimums: body.tableMinimums ? String(body.tableMinimums) : undefined,
      upcomingEvents: body.upcomingEvents ? String(body.upcomingEvents) : undefined,
      logoUrl: body.logoUrl ? String(body.logoUrl) : undefined,
      heroPhotoUrl: body.heroPhotoUrl ? String(body.heroPhotoUrl) : undefined,
      authorityAttested: Boolean(body.authorityAttested),
      accuracyAttested: Boolean(body.accuracyAttested),
      mediaRightsAttested: Boolean(body.mediaRightsAttested),
    });
    return NextResponse.json({
      ok: true,
      id: result.id,
      status: result.status,
      verified: false,
      note: "Brand profile received. Nothing goes live until Wingman verifies every item.",
    });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Could not submit the application.", 400);
  }
}
