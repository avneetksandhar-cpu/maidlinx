import { NextResponse } from "next/server";
import { isProductAdmin } from "@/lib/auth/permissions";
import { isResponse, jsonError, requireOperator } from "@/lib/api/http";
import { withUserContext } from "@/lib/db";
import { writeAudit } from "@/lib/marketplace/audit";
import { VERIFICATION_GATES, type VerificationGate } from "@/lib/marketplace/constants";
import {
  createApplication,
  importDiscoveryEvents,
  markVerificationGate,
  verifyWingmanFromApplication,
} from "@/lib/marketplace/service";

export const runtime = "nodejs";

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
    if (action === "reverify_event") {
      await withUserContext(user, async (client) => {
        await client.query(
          `UPDATE events SET source_verified_at = now(), updated_at = now() WHERE id = $1`,
          [body.eventId],
        );
        await writeAudit(client, {
          actorId: user.id,
          entityType: "event",
          entityId: String(body.eventId),
          action: "reverify",
        });
      });
      return NextResponse.json({ ok: true });
    }

    if (action === "update_event") {
      await withUserContext(user, async (client) => {
        await client.query(
          `UPDATE events
           SET discovery_status = COALESCE($2::event_discovery_status, discovery_status),
               official_source_url = COALESCE($3, official_source_url),
               internal_notes = COALESCE($4, internal_notes),
               updated_at = now()
           WHERE id = $1`,
          [body.eventId, body.discoveryStatus ?? null, body.officialSourceUrl ?? null, body.internalNotes ?? null],
        );
        await writeAudit(client, {
          actorId: user.id,
          entityType: "event",
          entityId: String(body.eventId),
          action: "update",
        });
      });
      return NextResponse.json({ ok: true });
    }

    if (action === "create_offer") {
      const offer = await withUserContext(user, async (client) => {
        const wingman = await client.query<{ verification_status: string; suspended_at: string | null }>(
          "SELECT verification_status, suspended_at FROM wingmen WHERE id = $1",
          [body.wingmanId],
        );
        if (wingman.rows[0]?.verification_status !== "verified" || wingman.rows[0]?.suspended_at) {
          throw new Error("Unverified or suspended Wingmen cannot host tables or publish offers.");
        }
        const inserted = await client.query<{ id: string; bookable: boolean }>(
          `INSERT INTO wingman_event_offers (
             event_id, wingman_id, service_type, table_package_name, max_group_size,
             minimum_spend_cents, service_fee_cents, taxes_and_fees_cents, arrival_window,
             dress_requirement, age_requirement, cancellation_terms, inventory_quantity,
             expires_at, operator_approved, terms
           ) VALUES (
             $1, $2, $3::offer_service_type, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14::timestamptz, $15, $16
           ) RETURNING id, bookable`,
          [
            body.eventId,
            body.wingmanId,
            body.serviceType,
            body.tablePackageName ?? null,
            body.maxGroupSize ?? null,
            body.minimumSpendCents ?? null,
            body.serviceFeeCents,
            body.taxesAndFeesCents ?? 0,
            body.arrivalWindow ?? null,
            body.dressRequirement ?? null,
            body.ageRequirement ?? null,
            body.cancellationTerms,
            body.inventoryQuantity ?? 0,
            body.expiresAt,
            Boolean(body.operatorApproved),
            body.terms,
          ],
        );
        await writeAudit(client, {
          actorId: user.id,
          entityType: "offer",
          entityId: inserted.rows[0].id,
          action: "create",
          toState: inserted.rows[0].bookable ? "bookable" : "not_bookable",
        });
        return inserted.rows[0];
      });
      return NextResponse.json({ ok: true, offer });
    }

    if (action === "set_offer_approval") {
      const offer = await withUserContext(user, async (client) => {
        const updated = await client.query<{ id: string; bookable: boolean }>(
          `UPDATE wingman_event_offers
           SET operator_approved = $2, updated_at = now()
           WHERE id = $1
           RETURNING id, bookable`,
          [body.offerId, Boolean(body.approved)],
        );
        await writeAudit(client, {
          actorId: user.id,
          entityType: "offer",
          entityId: String(body.offerId),
          action: body.approved ? "approve" : "disable",
        });
        return updated.rows[0];
      });
      return NextResponse.json({ ok: true, offer });
    }

    if (action === "pause_wingman") {
      await withUserContext(user, async (client) => {
        await client.query(
          `UPDATE wingmen SET verification_status = 'paused', updated_at = now() WHERE id = $1`,
          [body.wingmanId],
        );
        await writeAudit(client, {
          actorId: user.id,
          entityType: "wingman",
          entityId: String(body.wingmanId),
          action: "pause",
        });
      });
      return NextResponse.json({ ok: true });
    }

    if (action === "mark_gate") {
      const gate = String(body.gate ?? "") as VerificationGate;
      if (!VERIFICATION_GATES.includes(gate)) return jsonError("Unknown gate.", 400);
      await markVerificationGate(user, String(body.applicationId), gate);
      return NextResponse.json({ ok: true });
    }

    if (action === "create_event") {
      const officialSource = String(body.officialSourceUrl ?? "").trim();
      const eventName = String(body.name ?? "").trim();
      const venueName = String(body.venueName ?? "").trim();
      const localDate = String(body.localDate ?? "").trim();
      if (!eventName || !venueName || !localDate) {
        return jsonError("Event name, venue, and date are required.", 400);
      }
      if (!officialSource.startsWith("http")) {
        return jsonError("Official source must be an http(s) URL.", 400);
      }
      const result = await importDiscoveryEvents(user, [
        {
          externalId: String(body.externalId ?? "").trim() || `IMP-${Date.now()}`,
          name: eventName,
          venue: venueName,
          eventDate: localDate,
          startTime: String(body.localTimeText ?? "11:00 PM").trim(),
          area: String(body.area ?? "Miami").trim(),
          category: String(body.category ?? "Nightlife").trim(),
          age: String(body.ageRequirement ?? "21+").trim(),
          officialSource,
          lastVerified: new Date().toISOString().slice(0, 10),
          availableServices: [],
          wingmanCoverage: "Unassigned",
          bookingStatus: "Awaiting Wingman inventory",
          internalNotes: String(body.internalNotes ?? ""),
        },
      ]);
      return NextResponse.json({ ok: true, ...result });
    }

    if (action === "create_application") {
      const applicationId = await createApplication(user, {
        organizationName: String(body.organizationName ?? ""),
        leadType: body.leadType ? String(body.leadType) : undefined,
        publicSource: body.publicSource ? String(body.publicSource) : undefined,
        publicContact: body.publicContact ? String(body.publicContact) : undefined,
        likelyCoverage: body.likelyCoverage ? String(body.likelyCoverage) : undefined,
        ownerName: body.ownerName ? String(body.ownerName) : undefined,
        nextAction: body.nextAction ? String(body.nextAction) : undefined,
        internalNotes: body.internalNotes ? String(body.internalNotes) : undefined,
      });
      return NextResponse.json({ ok: true, applicationId, productionVisible: false });
    }

    if (action === "approve_venue") {
      const { approveVenueApplication } = await import("@/lib/venues/service");
      const result = await approveVenueApplication(String(body.applicationId), user.id);
      return NextResponse.json({ ok: true, ...result, verified: true });
    }

    if (action === "reject_venue") {
      const { rejectVenueApplication } = await import("@/lib/venues/service");
      const result = await rejectVenueApplication(
        String(body.applicationId),
        body.notes ? String(body.notes) : undefined,
      );
      return NextResponse.json({ ok: true, ...result, verified: false });
    }

    if (action === "verify_wingman") {
      const wingmanId = await verifyWingmanFromApplication(
        user,
        String(body.applicationId),
        String(body.displayName ?? "").trim(),
      );
      return NextResponse.json({ ok: true, wingmanId });
    }

    if (action === "update_fees") {
      if (!isProductAdmin(user)) return jsonError("Only the product admin can change fees.", 403);
      await withUserContext(user, async (client) => {
        await client.query(
          `UPDATE marketplace_settings
           SET customer_fee_bps = $1, supplier_commission_bps = $2, updated_at = now()
           WHERE id = 'default'`,
          [Number(body.customerFeeBps), Number(body.supplierCommissionBps)],
        );
        await writeAudit(client, {
          actorId: user.id,
          entityType: "marketplace_settings",
          entityId: "default",
          action: "fees",
          payload: {
            customerFeeBps: body.customerFeeBps,
            supplierCommissionBps: body.supplierCommissionBps,
          },
        });
      });
      return NextResponse.json({ ok: true });
    }

    if (action === "cancel_booking") {
      const { cancelRequest } = await import("@/lib/marketplace/test-booking");
      const result = await cancelRequest(user, String(body.requestId), body.notes ? String(body.notes) : undefined);
      return NextResponse.json({ ok: true, ...result });
    }

    if (action === "refund") {
      const env = (await import("@/lib/payments/env")).readStripeEnv();
      if (!env.ok) return jsonError(env.error, 503);
      await withUserContext(user, async (client) => {
        const payment = await client.query<{
          stripe_payment_intent_id: string | null;
          request_id: string;
        }>("SELECT stripe_payment_intent_id, request_id FROM payments WHERE id = $1", [body.paymentId]);
        const row = payment.rows[0];
        if (!row?.stripe_payment_intent_id) throw new Error("No Stripe payment to refund.");
        const stripe = (await import("@/services/stripe")).getStripeClient();
        await stripe.refunds.create({ payment_intent: row.stripe_payment_intent_id });
        await client.query(
          `UPDATE booking_requests SET status = 'refunded', updated_at = now() WHERE id = $1`,
          [row.request_id],
        );
        await client.query(
          `UPDATE payments SET status = 'refunded', updated_at = now() WHERE id = $1`,
          [body.paymentId],
        );
        await writeAudit(client, {
          actorId: user.id,
          entityType: "payment",
          entityId: String(body.paymentId),
          action: "refund",
          toState: "refunded",
        });
      });
      return NextResponse.json({ ok: true });
    }

    if (action === "update_catalog") {
      const { updateCatalogProduct } = await import("@/lib/catalog/service");
      const product = await withUserContext(user, async (client) => {
        const updated = await updateCatalogProduct(client, {
          id: String(body.id),
          priceCents: body.priceCents == null ? undefined : Number(body.priceCents),
          name: body.name ? String(body.name) : undefined,
          includedCopy: body.includedCopy ? String(body.includedCopy) : undefined,
          extrasCopy: body.extrasCopy ? String(body.extrasCopy) : undefined,
          drinkOptions: Array.isArray(body.drinkOptions) ? body.drinkOptions.map(String) : undefined,
          maxGuests: body.maxGuests === null ? null : body.maxGuests == null ? undefined : Number(body.maxGuests),
          active: typeof body.active === "boolean" ? body.active : undefined,
        });
        await writeAudit(client, {
          actorId: user.id,
          entityType: "experience_catalog",
          entityId: updated.id,
          action: "update_price",
          payload: { priceCents: updated.priceCents, slug: updated.slug },
        });
        return updated;
      });
      return NextResponse.json({ ok: true, product });
    }

    if (action === "assign_after_pay") {
      const { assignWingmanAfterPay } = await import("@/lib/orders/assign");
      const result = await withUserContext(user, async (client) =>
        assignWingmanAfterPay(client, {
          requestId: String(body.requestId),
          wingmanId: String(body.wingmanId),
          actorId: user.id,
        }),
      );
      return NextResponse.json({ ok: result.ok, hostName: result.hostName });
    }

    if (action === "record_note") {
      await withUserContext(user, async (client) => {
        await writeAudit(client, {
          actorId: user.id,
          entityType: String(body.entityType ?? "note"),
          entityId: String(body.entityId ?? "unknown"),
          action: "internal_note",
          payload: { note: body.note },
        });
      });
      return NextResponse.json({ ok: true });
    }

    return jsonError("Unknown action.", 400);
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Action failed.", 400);
  }
}
