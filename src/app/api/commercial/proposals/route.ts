import { NextResponse } from "next/server";
import { z } from "zod";
import { requireCustomerSession } from "@/lib/dashboard/session";
import { requireProfessionalSession } from "@/lib/pro/dashboard/session";
import {
  approveProposal,
  createProviderProposal,
  listProposalsForSite,
  requestWalkthrough,
} from "@/lib/commercial/proposals";
import { createAdminClient } from "@/lib/supabase/admin";

const CreateSchema = z.object({
  siteAddressId: z.string().uuid(),
  scopeId: z.string().uuid(),
  clientPriceCents: z.number().int().nonnegative(),
  providerPayoutCents: z.number().int().nonnegative(),
  inclusions: z.string().trim().max(2000).optional().nullable(),
  exclusions: z.string().trim().max(2000).optional().nullable(),
  billingCadence: z.enum(["per_visit", "monthly", "net15", "net30"]).optional(),
  firstVisitDate: z.string().trim().max(32).optional().nullable(),
  dueNowCents: z.number().int().nonnegative().optional(),
  paymentExpected: z.string().trim().max(120).optional(),
  idempotencyKey: z.string().trim().min(8).max(120),
});

const ApproveSchema = z.object({
  proposalId: z.string().uuid(),
  action: z.enum(["approve", "walkthrough"]),
});

export async function GET(request: Request) {
  try {
    const { profile } = await requireCustomerSession();
    const siteAddressId = new URL(request.url).searchParams.get("siteAddressId");
    if (!siteAddressId) {
      return NextResponse.json({ error: "siteAddressId required" }, { status: 400 });
    }
    const proposals = await listProposalsForSite({
      siteAddressId,
      userId: profile.id,
    });
    return NextResponse.json({ data: { proposals } });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to list proposals." },
      { status: 400 },
    );
  }
}

/** Provider creates a proposal (idempotent). */
export async function POST(request: Request) {
  try {
    const { profile, email } = await requireProfessionalSession();
    const body = CreateSchema.safeParse(await request.json());
    if (!body.success) {
      return NextResponse.json(
        { error: body.error.errors[0]?.message ?? "Invalid proposal." },
        { status: 400 },
      );
    }

    const supabase = createAdminClient();
    const { data: cleaner } = await supabase
      .from("cleaners")
      .select("id")
      .eq("user_id", profile.id)
      .maybeSingle();
    if (!cleaner) {
      return NextResponse.json({ error: "Cleaner profile required." }, { status: 400 });
    }

    const proposal = await createProviderProposal({
      cleanerId: String((cleaner as { id: string }).id),
      providerUserId: profile.id,
      providerName:
        [profile.firstName, profile.lastName].filter(Boolean).join(" ").trim() ||
        email,
      ...body.data,
    });

    return NextResponse.json({ data: { proposal } });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to create proposal." },
      { status: 400 },
    );
  }
}

/** Buyer approves or requests walkthrough. */
export async function PATCH(request: Request) {
  try {
    const { profile } = await requireCustomerSession();
    const body = ApproveSchema.safeParse(await request.json());
    if (!body.success) {
      return NextResponse.json(
        { error: body.error.errors[0]?.message ?? "Invalid action." },
        { status: 400 },
      );
    }

    if (body.data.action === "walkthrough") {
      const proposal = await requestWalkthrough({
        proposalId: body.data.proposalId,
        userId: profile.id,
      });
      return NextResponse.json({ data: { proposal } });
    }

    const result = await approveProposal({
      proposalId: body.data.proposalId,
      userId: profile.id,
    });
    return NextResponse.json({
      data: {
        proposal: result.proposal,
        serviceOrderId: result.serviceOrderId,
        visitBookingId: result.visitBookingId,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to update proposal." },
      { status: 400 },
    );
  }
}
