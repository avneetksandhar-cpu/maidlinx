import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import {
  confirmBookingPayment,
  confirmBookingPaymentMethod,
  getBookingById,
} from "@/lib/bookings/repository";
import { notifyBookingConfirmed } from "@/lib/notifications";
import { applySucceededCompletionPayment } from "@/lib/payments/charge-on-complete";
import { COMPLETION_PAYMENT_TYPE, SETUP_PAYMENT_TYPE } from "@/lib/payments/pay-after";
import { claimStripeWebhookEvent } from "@/lib/payments/webhook-events";
import { getStripeServer } from "@/lib/stripe/server";

export async function POST(request: Request) {
  const body = await request.text();
  const signature = (await headers()).get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: "Webhook misconfigured." }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = getStripeServer().webhooks.constructEvent(body, signature, webhookSecret);
  } catch {
    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 400 });
  }

  const bookingIdFromMeta = (() => {
    const obj = event.data.object as { metadata?: { bookingId?: string } };
    return obj.metadata?.bookingId ?? null;
  })();

  const claim = await claimStripeWebhookEvent({
    eventId: event.id,
    eventType: event.type,
    bookingId: bookingIdFromMeta,
    summary: { livemode: event.livemode },
  });

  if (claim === "duplicate") {
    return NextResponse.json({ received: true, duplicate: true }, { status: 200 });
  }

  switch (event.type) {
    case "setup_intent.succeeded": {
      const setupIntent = event.data.object as Stripe.SetupIntent;
      const bookingId = setupIntent.metadata?.bookingId;
      if (!bookingId) break;

      const paymentMethodId =
        typeof setupIntent.payment_method === "string"
          ? setupIntent.payment_method
          : setupIntent.payment_method?.id ?? null;
      const customerId =
        typeof setupIntent.customer === "string"
          ? setupIntent.customer
          : setupIntent.customer?.id ?? null;

      if (!paymentMethodId || !customerId) break;

      const stripe = getStripeServer();
      let cardBrand: string | null = null;
      let cardLast4: string | null = null;
      try {
        const pm = await stripe.paymentMethods.retrieve(paymentMethodId);
        cardBrand = pm.card?.brand ?? null;
        cardLast4 = pm.card?.last4 ?? null;
      } catch {
        // best-effort display fields
      }

      const updatedBooking = await confirmBookingPaymentMethod({
        bookingId,
        setupIntentId: setupIntent.id,
        stripeCustomerId: customerId,
        paymentMethodId,
        cardBrand,
        cardLast4,
      });

      if (updatedBooking) {
        try {
          await notifyBookingConfirmed(updatedBooking, 0);
        } catch (notifyError) {
          console.error("[stripe webhook] booking confirmation notification failed:", notifyError);
        }
      }
      break;
    }
    case "payment_intent.succeeded": {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const bookingId = paymentIntent.metadata.bookingId;
      const paymentType = paymentIntent.metadata.paymentType ?? "deposit";

      if (bookingId) {
        const stripe = getStripeServer();
        let receiptUrl: string | null = null;
        let chargeId: string | null = null;

        if (paymentIntent.latest_charge) {
          chargeId =
            typeof paymentIntent.latest_charge === "string"
              ? paymentIntent.latest_charge
              : paymentIntent.latest_charge.id;
          const charge = await stripe.charges.retrieve(chargeId);
          receiptUrl = charge.receipt_url ?? null;
        }

        const amountCents = paymentIntent.amount_received || paymentIntent.amount;

        if (paymentType === COMPLETION_PAYMENT_TYPE) {
          // After-clean charge — never re-run request confirmation.
          await applySucceededCompletionPayment({
            bookingId,
            paymentIntentId: paymentIntent.id,
            amountCents,
            chargeId,
            receiptUrl,
          });
          break;
        }

        if (paymentType === SETUP_PAYMENT_TYPE) {
          // Should not happen (setup uses SetupIntent), ignore.
          break;
        }

        const updatedBooking = await confirmBookingPayment(
          bookingId,
          receiptUrl,
          chargeId,
          paymentIntent.id,
          amountCents,
          paymentType,
        );

        if (updatedBooking) {
          try {
            await notifyBookingConfirmed(updatedBooking, amountCents);
          } catch (notifyError) {
            console.error("[stripe webhook] booking confirmation notification failed:", notifyError);
          }
        }
      }
      break;
    }
    case "payment_intent.payment_failed": {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const bookingId = paymentIntent.metadata.bookingId;
      const paymentType = paymentIntent.metadata.paymentType ?? "deposit";

      if (bookingId) {
        const booking = await getBookingById(bookingId);
        if (booking) {
          const { upsertPaymentRecord } = await import("@/lib/bookings/repository");
          const { emitBookingEvent } = await import("@/lib/bookings/events");
          await upsertPaymentRecord({
            bookingId,
            amountCents: paymentIntent.amount,
            currency: booking.currency,
            paymentType,
            stripePaymentIntentId: paymentIntent.id,
            status: "failed",
          });
          if (paymentType === COMPLETION_PAYMENT_TYPE) {
            const { createAdminClient } = await import("@/lib/supabase/admin");
            await createAdminClient()
              .from("bookings")
              .update({ payment_status: "failed" } as never)
              .eq("id", bookingId);
          }
          await emitBookingEvent({
            bookingId,
            type: "payment_failed",
            actor: { role: "system" },
            metadata: {
              amountCents: paymentIntent.amount,
              paymentType,
            },
          });
        }
      }
      break;
    }
    case "charge.refunded": {
      // Informational — refund rows are owned by admin/cancel flows.
      break;
    }
    case "account.updated":
      break;
    default:
      break;
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
