import { NextResponse } from "next/server";
import { z } from "zod";
import { requireCustomerSession } from "@/lib/dashboard/session";
import { requireProfessionalSession } from "@/lib/pro/dashboard/session";
import {
  assignCrewLead,
  cancelServiceOrder,
  getServiceOrderForBuyer,
  listServiceOrdersForBuyer,
  scheduleNextVisitAtAgreedRate,
} from "@/lib/commercial/orders";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  try {
    const { profile } = await requireCustomerSession();
    const orderId = new URL(request.url).searchParams.get("orderId");
    if (orderId) {
      const order = await getServiceOrderForBuyer(orderId, profile.id);
      return NextResponse.json({ data: { order } });
    }
    const orders = await listServiceOrdersForBuyer(profile.id);
    return NextResponse.json({ data: { orders } });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to load orders." },
      { status: 400 },
    );
  }
}

const PatchSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("cancel"),
    orderId: z.string().uuid(),
    reason: z.string().trim().min(1).max(500),
  }),
  z.object({
    action: z.literal("repeat"),
    orderId: z.string().uuid(),
    sequence: z.number().int().positive(),
  }),
  z.object({
    action: z.literal("assign_crew"),
    orderId: z.string().uuid(),
    crewLeadUserId: z.string().uuid(),
  }),
]);

export async function PATCH(request: Request) {
  try {
    const body = PatchSchema.safeParse(await request.json());
    if (!body.success) {
      return NextResponse.json(
        { error: body.error.errors[0]?.message ?? "Invalid order action." },
        { status: 400 },
      );
    }

    if (body.data.action === "assign_crew") {
      const { profile } = await requireProfessionalSession();
      const supabase = createAdminClient();
      const { data: cleaner } = await supabase
        .from("cleaners")
        .select("id")
        .eq("user_id", profile.id)
        .maybeSingle();
      if (!cleaner) {
        return NextResponse.json({ error: "Cleaner profile required." }, { status: 400 });
      }
      const order = await assignCrewLead({
        orderId: body.data.orderId,
        providerUserId: profile.id,
        cleanerId: String((cleaner as { id: string }).id),
        crewLeadUserId: body.data.crewLeadUserId,
      });
      return NextResponse.json({ data: { order } });
    }

    const { profile } = await requireCustomerSession();
    if (body.data.action === "cancel") {
      const order = await cancelServiceOrder({
        orderId: body.data.orderId,
        userId: profile.id,
        reason: body.data.reason,
      });
      return NextResponse.json({ data: { order } });
    }

    const visitBookingId = await scheduleNextVisitAtAgreedRate({
      orderId: body.data.orderId,
      userId: profile.id,
      sequence: body.data.sequence,
    });
    return NextResponse.json({ data: { visitBookingId } });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to update order." },
      { status: 400 },
    );
  }
}
