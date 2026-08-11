import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { confirmBookingPayment, getBookingById } from "@/lib/bookings/repository";
import { notifyBookingConfirmed } from "@/lib/notifications";
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
    case "payment_intent.succeeded": {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const bookingId = paymentIntent.metadata.bookingId;

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

        const paymentType = paymentIntent.metadata.paymentType ?? "deposit";
        const amountCents = paymentIntent.amount_received || paymentIntent.amount;

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

      if (bookingId) {
        const booking = await getBookingById(bookingId);
        if (booking) {
          const { upsertPaymentRecord } = await import("@/lib/bookings/repository");
          const { emitBookingEvent } = await import("@/lib/bookings/events");
          await upsertPaymentRecord({
            bookingId,
            amountCents: paymentIntent.amount,
            currency: booking.currency,
            paymentType: paymentIntent.metadata.paymentType ?? "deposit",
            stripePaymentIntentId: paymentIntent.id,
            status: "failed",
          });
          await emitBookingEvent({
            bookingId,
            type: "payment_failed",
            actor: { role: "system" },
            metadata: {
              amountCents: paymentIntent.amount,
              paymentType: paymentIntent.metadata.paymentType ?? "deposit",
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
