import { BOOKING_SERVICES } from "@/lib/bookings/constants";
import type { StoredBooking } from "@/lib/bookings/repository";
import { formatCurrency } from "@/lib/utils";
import { enqueueNotification } from "@/lib/notifications/outbox";

function getServiceLabel(serviceType: string): string {
  return BOOKING_SERVICES.find((s) => s.id === serviceType)?.label ?? serviceType;
}

function formatSchedule(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

function bookingReference(booking: StoredBooking): string {
  return booking.id.slice(0, 8).toUpperCase();
}

export async function notifyBookingConfirmed(
  booking: StoredBooking,
  depositCents: number,
): Promise<void> {
  if (!booking.customer_email) return;

  const service = getServiceLabel(booking.service_type);
  const reference = bookingReference(booking);
  const scheduled = formatSchedule(booking.scheduled_at);
  const address = [booking.address_line1, booking.address_city, booking.address_state]
    .filter(Boolean)
    .join(", ");

  const html = `
      <p>Hi ${booking.customer_first_name ?? "there"},</p>
      <p>Your MaidLinx booking is confirmed.</p>
      <ul>
        <li><strong>Reference:</strong> ${reference}</li>
        <li><strong>Service:</strong> ${service}</li>
        <li><strong>When:</strong> ${scheduled}</li>
        <li><strong>Address:</strong> ${address}</li>
        <li><strong>Deposit paid:</strong> ${formatCurrency(depositCents, booking.currency)}</li>
        <li><strong>Total:</strong> ${formatCurrency(booking.total_cents, booking.currency)}</li>
      </ul>
      <p>We'll notify you when your cleaner is on the way.</p>
    `;

  await enqueueNotification({
    channel: "email",
    recipient: booking.customer_email,
    subject: `MaidLinx booking confirmed — ${reference}`,
    body: html,
    templateKey: "booking_confirmed",
    bookingId: booking.id,
    profileId: booking.customer_id,
    metadata: { depositCents },
  });

  if (booking.customer_phone) {
    await enqueueNotification({
      channel: "sms",
      recipient: booking.customer_phone,
      body: `MaidLinx: Booking ${reference} confirmed for ${scheduled}. Deposit ${formatCurrency(depositCents, booking.currency)} received.`,
      templateKey: "booking_confirmed_sms",
      bookingId: booking.id,
      profileId: booking.customer_id,
    });
  }
}

const STATUS_MESSAGES: Record<string, string> = {
  on_the_way: "Your cleaner is on the way.",
  arrived: "Your cleaner has arrived.",
  in_progress: "Your clean has started.",
  completed: "Your clean is complete. Thank you for choosing MaidLinx!",
};

export async function notifyJobStatusChange(
  booking: StoredBooking,
  toStatus: string,
): Promise<void> {
  const message = STATUS_MESSAGES[toStatus];
  if (!message || !booking.customer_email) return;

  const reference = bookingReference(booking);
  const service = getServiceLabel(booking.service_type);

  await enqueueNotification({
    channel: "email",
    recipient: booking.customer_email,
    subject: `MaidLinx update — ${reference}`,
    body: `
      <p>Hi ${booking.customer_first_name ?? "there"},</p>
      <p>${message}</p>
      <p><strong>Reference:</strong> ${reference}<br/>
      <strong>Service:</strong> ${service}</p>
    `,
    templateKey: `status_${toStatus}`,
    bookingId: booking.id,
    profileId: booking.customer_id,
  });

  if (booking.customer_phone) {
    await enqueueNotification({
      channel: "sms",
      recipient: booking.customer_phone,
      body: `MaidLinx ${reference}: ${message}`,
      templateKey: `status_${toStatus}_sms`,
      bookingId: booking.id,
      profileId: booking.customer_id,
    });
  }
}

export { enqueueNotification, processOutboxItem } from "@/lib/notifications/outbox";
