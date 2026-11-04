import { NextResponse } from "next/server";
import { z } from "zod";
import { requireProfessionalSession } from "@/lib/pro/dashboard/session";
import { submitCommercialVisitReport } from "@/lib/commercial/visits";

const Schema = z.object({
  bookingId: z.string().uuid(),
  items: z
    .array(
      z.object({
        checklistItemId: z.string().min(1).max(80),
        label: z.string().min(1).max(200),
        result: z.enum(["completed", "missed", "not_applicable"]),
        missReason: z.string().trim().max(500).optional().nullable(),
      }),
    )
    .min(1),
});

export async function POST(request: Request) {
  try {
    const { profile } = await requireProfessionalSession();
    const body = Schema.safeParse(await request.json());
    if (!body.success) {
      return NextResponse.json(
        { error: body.error.errors[0]?.message ?? "Invalid visit report." },
        { status: 400 },
      );
    }
    const result = await submitCommercialVisitReport({
      bookingId: body.data.bookingId,
      profileId: profile.id,
      items: body.data.items,
    });
    return NextResponse.json({ data: result });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to submit report." },
      { status: 400 },
    );
  }
}
