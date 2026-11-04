import type { AuthUser } from "@/lib/auth/types";
import { experienceLabel, platformTakeCents, validateCartItem } from "@/lib/catalog/rules";
import { getCatalogBySlug } from "@/lib/catalog/service";
import { expandCartItems } from "@/lib/cart/expand";
import type { CartItemInput, PricedCartItem } from "@/lib/catalog/types";
import { withUserContext } from "@/lib/db";
import { writeAudit } from "@/lib/marketplace/audit";
import type { SpendBand } from "@/lib/marketplace/constants";
import { offerIsBookable } from "@/lib/marketplace/offers";
import { listBookableOffers } from "@/lib/marketplace/service";
import { readStripeEnv } from "@/lib/payments/env";
import { getStripeClient } from "@/services/stripe";

const EXPERIENCE_TERMS =
  "This is a Wingman Experience, not a VIP table. Extra drinks, bottles, food, upgrades, tables, or other purchases are separate. Your Wingman is assigned after payment.";
const VIP_TERMS =
  "This is a VIP table reservation at the listed table price. Platform take is 10% of the table. Extra purchases at the venue are separate.";

function spendBandFor(cents: number): SpendBand {
  if (cents >= 500_000) return "band_5000_plus";
  if (cents >= 150_000) return "band_1500_5000";
  return "band_500_1500";
}

export async function priceCartItems(items: CartItemInput[]): Promise<PricedCartItem[]> {
  if (items.length === 0) throw new Error("Your cart is empty.");
  const priced: PricedCartItem[] = [];

  for (const item of items) {
    if (item.kind === "wingman_experience") {
      const product = await getCatalogBySlug(item.catalogSlug ?? "");
      const error = validateCartItem(item, product);
      if (error || !product) throw new Error(error ?? "That experience is not available.");
      priced.push({
        ...item,
        catalogId: product.id,
        unitPriceCents: product.priceCents,
        experienceName: product.name,
        label: experienceLabel(product, item),
      });
      continue;
    }

    const error = validateCartItem(item, null);
    if (error) throw new Error(error);
    if (!item.offerId || !item.eventId) {
      throw new Error("VIP tables are only available when a real table is bookable.");
    }
    const offers = await listBookableOffers(item.eventId);
    const offer = offers.find((row) => String(row.id) === item.offerId);
    if (!offer) throw new Error("That VIP table is no longer bookable.");
    const bookable = offerIsBookable({
      wingmanStatus: String(offer.verification_status ?? "") as "verified",
      operatorApproved: Boolean(offer.operator_approved),
      expiresAt: offer.expires_at ? String(offer.expires_at) : null,
      inventoryQuantity: Number(offer.inventory_quantity ?? 0),
      serviceType: offer.service_type ? String(offer.service_type) : null,
      terms: offer.terms ? String(offer.terms) : null,
      serviceFeeCents: offer.service_fee_cents == null ? null : Number(offer.service_fee_cents),
    });
    if (!bookable) throw new Error("That VIP table is no longer bookable.");
    const tableCents = Number(offer.minimum_spend_cents ?? 0);
    const feeCents = Number(offer.service_fee_cents ?? 0);
    const taxCents = Number(offer.taxes_and_fees_cents ?? 0);
    const total = tableCents + feeCents + taxCents;
    if (total < 1) throw new Error("That VIP table does not have a price yet.");
    priced.push({
      ...item,
      catalogId: null,
      unitPriceCents: total,
      label: String(offer.table_package_name || item.experienceName || "VIP Table"),
    });
  }

  return priced;
}

export async function checkoutCart(user: AuthUser, items: CartItemInput[]) {
  const env = readStripeEnv();
  if (!env.ok) {
    throw new Error("Payment is not available right now.");
  }

  const priced = await priceCartItems(expandCartItems(items));
  const totalCents = priced.reduce((sum, item) => sum + item.unitPriceCents, 0);

  return withUserContext(user, async (client) => {
    const order = await client.query<{ id: string }>(
      `INSERT INTO orders (customer_id, status, total_cents)
       VALUES ($1, 'pending_payment', $2)
       RETURNING id`,
      [user.id, totalCents],
    );
    const orderId = order.rows[0].id;
    const created: Array<{ requestId: string; quoteId: string; item: PricedCartItem }> = [];

    for (const item of priced) {
      const startsAt = item.startsAt?.trim() || new Date().toISOString();
      const occasion = item.label;
      const atmosphere = item.kind === "vip_table" ? "VIP table" : "Wingman Experience";
      const area = item.venueName?.trim() || "Miami";
      const nightPlan = {
        kind: item.kind,
        catalogSlug: item.catalogSlug ?? null,
        drinkOption: item.drinkOption ?? null,
        offerId: item.offerId ?? null,
        platformTakeCents: platformTakeCents(item.kind, item.unitPriceCents),
      };

      const request = await client.query<{ id: string }>(
        `INSERT INTO booking_requests (
           customer_id, event_id, requested_wingman_id, assigned_wingman_id, source,
           occasion, atmosphere, area, starts_at, group_size, spend_band, special_requests,
           requested_services, night_goal, night_plan, status, offer_id, order_id, catalog_id,
           drink_option, booking_kind,
           service_scope_ack_at, code_of_conduct_ack_at, no_guarantees_ack_at
         ) VALUES (
           $1, $2, NULL, NULL, $3,
           $4, $5, $6, $7::timestamptz, $8, $9::spend_band, $10,
           ARRAY['hosted_experience']::text[], $3, $11::jsonb, 'draft', $12, $13, $14,
           $15, $3,
           now(), now(), now()
         )
         RETURNING id`,
        [
          user.id,
          item.eventId ?? null,
          item.kind,
          occasion,
          atmosphere,
          area,
          startsAt,
          item.guestCount,
          spendBandFor(item.unitPriceCents),
          item.kind === "vip_table" ? VIP_TERMS : EXPERIENCE_TERMS,
          JSON.stringify(nightPlan),
          item.offerId ?? null,
          orderId,
          item.catalogId,
          item.drinkOption ?? null,
        ],
      );
      const requestId = request.rows[0].id;

      const quote = await client.query<{ id: string }>(
        `INSERT INTO quotes (
           request_id, wingman_id, offer_id, subtotal_cents, service_fee_cents,
           taxes_cents, customer_fee_cents, total_cents, terms, status
         ) VALUES (
           $1, NULL, $2, $3, 0, 0, 0, $3, $4, 'accepted'
         )
         RETURNING id`,
        [
          requestId,
          item.offerId ?? null,
          item.unitPriceCents,
          item.kind === "vip_table" ? VIP_TERMS : EXPERIENCE_TERMS,
        ],
      );

      await client.query(
        `INSERT INTO order_items (
           order_id, request_id, kind, catalog_id, event_id, offer_id, drink_option,
           guest_count, unit_price_cents, venue_name, experience_name, starts_at, status
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12::timestamptz, 'pending_payment')`,
        [
          orderId,
          requestId,
          item.kind,
          item.catalogId,
          item.eventId ?? null,
          item.offerId ?? null,
          item.drinkOption ?? null,
          item.guestCount,
          item.unitPriceCents,
          item.venueName ?? null,
          item.label,
          startsAt,
        ],
      );

      created.push({ requestId, quoteId: quote.rows[0].id, item });
    }

    const stripe = getStripeClient();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3005";
    const firstRequest = created[0];
    const checkout = await stripe.checkout.sessions.create({
      mode: "payment",
      success_url: `${appUrl}/orders/${orderId}?paid=1`,
      cancel_url: `${appUrl}/cart?cancelled=1`,
      client_reference_id: orderId,
      metadata: {
        orderId,
        userId: user.id,
        requestId: firstRequest.requestId,
        requestIds: created.map((row) => row.requestId).join(","),
      },
      customer_email: user.email,
      customer_creation: "always",
      line_items: created.map((row) => ({
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: row.item.unitPriceCents,
          product_data: {
            name: row.item.label,
            description: row.item.kind === "vip_table" ? VIP_TERMS.slice(0, 400) : EXPERIENCE_TERMS.slice(0, 400),
          },
        },
      })),
    });

    await client.query(
      `UPDATE orders SET stripe_checkout_session_id = $2, updated_at = now() WHERE id = $1`,
      [orderId, checkout.id],
    );
    await client.query(
      `INSERT INTO payments (quote_id, request_id, order_id, stripe_checkout_session_id, amount_cents, status)
       VALUES ($1, $2, $3, $4, $5, 'checkout_created')
       ON CONFLICT (stripe_checkout_session_id) DO NOTHING`,
      [firstRequest.quoteId, firstRequest.requestId, orderId, checkout.id, totalCents],
    );
    await client.query(
      `UPDATE booking_requests
       SET status = 'payment_pending', updated_at = now()
       WHERE order_id = $1 AND status = 'draft'`,
      [orderId],
    );
    await writeAudit(client, {
      actorId: user.id,
      entityType: "order",
      entityId: orderId,
      action: "checkout_created",
      toState: "payment_pending",
      payload: { totalCents, itemCount: created.length, serverPriced: true },
    });

    return {
      orderId,
      url: checkout.url,
      id: checkout.id,
      totalCents,
      requestIds: created.map((row) => row.requestId),
    };
  });
}
