import { NextResponse } from "next/server";
import { z } from "zod";
import {
  ENTRY_METHODS,
  getVisitEntryInstructionsForRequester,
  saveVisitEntryInstructions,
} from "@/lib/commercial/entry-instructions";
import { requireCustomerSession } from "@/lib/dashboard/session";

const SaveSchema = z.object({
  bookingId: z.string().uuid(),
  method: z.enum(ENTRY_METHODS),
  note: z.string().trim().max(500).optional().default(""),
  applyTo: z.enum(["this_visit", "future_visits"]),
});

/**
 * Private entry instructions for a commercial visit.
 * GET/POST — buyer (customer or business manager) only.
 * Assigned crew reads via the same GET when professional_profile_id matches.
 * Never included in receipts or email payloads.
 */
export async function GET(request: Request) {
  try {
    const { profile } = await requireCustomerSession();
    const bookingId = new URL(request.url).searchParams.get("bookingId");
    if (!bookingId) {
      return NextResponse.json({ error: "bookingId required" }, { status: 400 });
    }

    const result = await getVisitEntryInstructionsForRequester({
      bookingId,
      requesterUserId: profile.id,
      requesterRole: profile.role,
    });

    if (!result.allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({
      data: {
        entry: result.entry,
        siteAddressId: result.siteAddressId,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to load entry instructions.",
      },
      { status: 400 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const { profile } = await requireCustomerSession();
    const body = SaveSchema.safeParse(await request.json());
    if (!body.success) {
      return NextResponse.json(
        { error: body.error.errors[0]?.message ?? "Invalid entry instructions." },
        { status: 400 },
      );
    }

    const entry = await saveVisitEntryInstructions({
      bookingId: body.data.bookingId,
      userId: profile.id,
      method: body.data.method,
      note: body.data.note,
      applyTo: body.data.applyTo,
    });

    return NextResponse.json({ data: { entry } });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to save entry instructions.",
      },
      { status: 400 },
    );
  }
}
