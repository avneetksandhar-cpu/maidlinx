import Link from "next/link";
import { BOOKING_EXTRAS, getBookingServiceLabel } from "@/lib/bookings/constants";
import type { StoredBooking } from "@/lib/bookings/repository";
import { getDueLaterCents, getDueNowCents, isPayAfterCleaningEnabled } from "@/lib/payments/pay-after";
import {
  formatBookingDate,
  formatBookingTimeRange,
} from "@/lib/dashboard/display";
import { formatCurrency } from "@/lib/utils";
import { routes, siteConfig } from "@/config/site";

interface BookingDetailsCardProps {
  booking: StoredBooking;
  showHelp?: boolean;
}

function extraLabels(extras: string[]): string[] {
  return extras.map((id) => {
    const match = BOOKING_EXTRAS.find((extra) => extra.id === id);
    return match?.label ?? id.replace(/_/g, " ");
  });
}

function formatSavedCard(booking: StoredBooking): string | null {
  if (!booking.card_last4) return null;
  const brand = booking.card_brand
    ? booking.card_brand.charAt(0).toUpperCase() + booking.card_brand.slice(1)
    : "Card";
  return `${brand} •••• ${booking.card_last4}`;
}

function paymentLabel(booking: StoredBooking): string {
  if (booking.status === "cancelled") return "Cancelled";
  if (booking.payment_status === "paid") return "Paid";
  if (booking.payment_status === "failed") return "Payment needs attention";
  if (booking.payment_status === "deposit_paid") return "Deposit paid";
  if (booking.stripe_payment_method_id || booking.card_last4) {
    return isPayAfterCleaningEnabled() ? "Card saved · charge after clean" : "Pending";
  }
  if (booking.status === "pending_payment") return "Pending";
  return "Payment update";
}

/** Real booked scope only — service + extras, never invent tasks. */
export function bookingTaskLabels(booking: StoredBooking): string[] {
  const tasks = [getBookingServiceLabel(booking.service_type)];
  tasks.push(...extraLabels(booking.extras));
  return tasks;
}

export function BookingDetailsCard({ booking, showHelp = true }: BookingDetailsCardProps) {
  const unit = booking.address_line2?.trim() || null;
  const addressLine = [booking.address_line1, booking.address_city, booking.address_state]
    .filter(Boolean)
    .join(", ");
  const postal = booking.address_postal_code?.trim() || null;
  const extras = extraLabels(booking.extras);
  const tasks = bookingTaskLabels(booking);
  const dueNow = getDueNowCents(booking.total_cents);
  const dueLater = getDueLaterCents(booking.total_cents);
  const savedCard = formatSavedCard(booking);
  const payAfter = isPayAfterCleaningEnabled();
  const serviceBits = [
    getBookingServiceLabel(booking.service_type),
    booking.bedrooms > 0
      ? `${booking.bedrooms} bed${booking.bedrooms === 1 ? "" : "s"}`
      : null,
    booking.bathrooms > 0
      ? `${booking.bathrooms} bath${booking.bathrooms === 1 ? "" : "s"}`
      : null,
  ].filter(Boolean);

  return (
    <section
      aria-labelledby="booking-details-heading"
      className="rounded-2xl border border-[var(--ml-dark-border)] bg-[var(--ml-dark-surface,#102B49)] p-5 shadow-[var(--shadow-soft)]"
    >
      <h2 id="booking-details-heading" className="text-[15px] font-semibold text-white">
        Booking details
      </h2>

      <dl className="mt-3 space-y-3 text-[14px]">
        <div className="flex justify-between gap-4">
          <dt className="text-[var(--ml-dark-ink-muted)]">Service</dt>
          <dd className="max-w-[60%] text-right font-medium text-white">
            {serviceBits.join(" · ") || "—"}
          </dd>
        </div>

        {booking.scheduled_at ? (
          <div className="flex justify-between gap-4">
            <dt className="text-[var(--ml-dark-ink-muted)]">When</dt>
            <dd className="max-w-[60%] text-right font-medium text-white">
              {formatBookingDate(booking.scheduled_at)}
              <br />
              {formatBookingTimeRange(
                booking.scheduled_at,
                booking.arrival_window_start,
                booking.arrival_window_end,
              )}
            </dd>
          </div>
        ) : null}

        <div className="flex justify-between gap-4">
          <dt className="text-[var(--ml-dark-ink-muted)]">Address</dt>
          <dd className="max-w-[60%] text-right font-medium text-white">
            {addressLine || "—"}
            {postal ? (
              <>
                <br />
                {postal}
              </>
            ) : null}
          </dd>
        </div>

        {unit ? (
          <div className="flex justify-between gap-4">
            <dt className="text-[var(--ml-dark-ink-muted)]">Unit / entry</dt>
            <dd className="max-w-[60%] text-right font-medium text-white">{unit}</dd>
          </div>
        ) : null}

        <div className="flex justify-between gap-4">
          <dt className="text-[var(--ml-dark-ink-muted)]">Extras</dt>
          <dd className="max-w-[60%] text-right font-medium text-white">
            {extras.length > 0 ? extras.join(", ") : "None"}
          </dd>
        </div>

        <div className="border-t border-[var(--ml-dark-border)] pt-3">
          <dt className="text-[var(--ml-dark-ink-muted)]">Today&apos;s clean</dt>
          <dd className="mt-2">
            <ul className="space-y-1.5">
              {tasks.map((task) => (
                <li key={task} className="flex items-start gap-2 text-[14px] text-white">
                  <span
                    className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[var(--ml-dark-mint,#04CED2)]"
                    aria-hidden
                  />
                  <span>{task}</span>
                </li>
              ))}
            </ul>
          </dd>
        </div>

        <div className="flex justify-between gap-4 border-t border-[var(--ml-dark-border)] pt-3">
          <dt className="text-[var(--ml-dark-ink-muted)]">Agreed total</dt>
          <dd className="font-semibold tabular-nums text-white">
            {formatCurrency(booking.total_cents, booking.currency)}
          </dd>
        </div>

        <div className="flex justify-between gap-4">
          <dt className="text-[var(--ml-dark-ink-muted)]">Due now</dt>
          <dd className="text-right font-medium text-white">
            {booking.payment_status === "paid"
              ? formatCurrency(0, booking.currency)
              : formatCurrency(
                  booking.payment_status === "deposit_paid" ? dueNow : dueNow,
                  booking.currency,
                )}
          </dd>
        </div>

        <div className="flex justify-between gap-4">
          <dt className="text-[var(--ml-dark-ink-muted)]">
            {payAfter ? "Charged after clean" : "Due after clean"}
          </dt>
          <dd className="text-right font-medium text-white">
            {booking.payment_status === "paid"
              ? formatCurrency(0, booking.currency)
              : formatCurrency(dueLater, booking.currency)}
          </dd>
        </div>

        {savedCard ? (
          <div className="flex justify-between gap-4">
            <dt className="text-[var(--ml-dark-ink-muted)]">Saved card</dt>
            <dd className="text-right font-medium text-white">{savedCard}</dd>
          </div>
        ) : null}

        {payAfter && booking.payment_status !== "paid" ? (
          <p className="rounded-xl bg-[var(--ml-dark-mint,#04CED2)]/10 px-3 py-2 text-xs text-[var(--ml-dark-mint,#04CED2)]">
            Charged after your clean · Stripe TEST
          </p>
        ) : null}

        <div className="flex justify-between gap-4">
          <dt className="text-[var(--ml-dark-ink-muted)]">Payment</dt>
          <dd className="text-right">
            <span className="inline-flex items-center rounded-full bg-[var(--ml-dark-mint,#04CED2)]/15 px-2.5 py-0.5 text-xs font-semibold text-[var(--ml-dark-mint,#04CED2)]">
              {paymentLabel(booking)}
            </span>
          </dd>
        </div>

        {/* Residential entry only — commercial private entry lives on status page (ACL). Never mirror codes onto receipts. */}
        {booking.notes?.trim() &&
        booking.notes.trim() !== "Commercial service order visit" &&
        !booking.is_commercial &&
        !booking.service_order_id ? (
          <div className="border-t border-[var(--ml-dark-border)] pt-3">
            <dt className="text-[var(--ml-dark-ink-muted)]">Entry instructions</dt>
            <dd className="mt-1 whitespace-pre-wrap text-right font-medium text-white">
              {booking.notes.trim()}
            </dd>
          </div>
        ) : null}

        {booking.cleaner ? (
          <div className="flex justify-between gap-4 border-t border-[var(--ml-dark-border)] pt-3">
            <dt className="text-[var(--ml-dark-ink-muted)]">Cleaner</dt>
            <dd className="max-w-[60%] text-right font-medium text-white">
              {[booking.cleaner.firstName, booking.cleaner.lastName]
                .filter(Boolean)
                .join(" ") || "Your MaidLinx Pro"}
            </dd>
          </div>
        ) : null}
      </dl>

      {showHelp ? (
        <div className="mt-4 flex flex-wrap gap-3 border-t border-[var(--ml-dark-border)] pt-4 text-sm">
          <Link
            href={routes.dashboardSupport}
            className="font-semibold text-[var(--ml-dark-mint,#04CED2)]"
          >
            Need help?
          </Link>
          <a
            href={siteConfig.links.support}
            className="font-semibold text-[var(--ml-dark-ink-muted)]"
          >
            Email support
          </a>
        </div>
      ) : null}
    </section>
  );
}
