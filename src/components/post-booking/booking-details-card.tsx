import Link from "next/link";
import { BOOKING_EXTRAS, getBookingServiceLabel } from "@/lib/bookings/constants";
import { isPaidBookingStatus } from "@/lib/bookings/status";
import type { StoredBooking } from "@/lib/bookings/repository";
import { calculateDepositCents } from "@/lib/payments/deposit";
import {
  formatBookingDate,
  formatBookingTimeRange,
} from "@/lib/dashboard/display";
import { formatCurrency } from "@/lib/utils";
import { routes, siteConfig } from "@/config/site";

interface BookingDetailsCardProps {
  booking: StoredBooking;
  /** Show support / help row. */
  showHelp?: boolean;
}

function extraLabels(extras: string[]): string[] {
  return extras.map((id) => {
    const match = BOOKING_EXTRAS.find((extra) => extra.id === id);
    return match?.label ?? id.replace(/_/g, " ");
  });
}

function paymentLabel(booking: StoredBooking): string {
  if (booking.status === "pending_payment") return "Pending payment";
  if (booking.status === "cancelled") return "Cancelled";
  if (isPaidBookingStatus(booking.status)) return "Deposit paid";
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
  const deposit = calculateDepositCents(booking.total_cents);
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
      className="rounded-2xl border border-[var(--ml-book-border,#e2e8f0)] bg-white p-5 shadow-[var(--shadow-soft)]"
    >
      <h2
        id="booking-details-heading"
        className="text-[15px] font-semibold text-[var(--ml-book-ink,#01193D)]"
      >
        Booking details
      </h2>

      <dl className="mt-3 space-y-3 text-[14px]">
        <div className="flex justify-between gap-4">
          <dt className="text-[var(--ml-book-ink-muted,#4a5568)]">Service</dt>
          <dd className="max-w-[60%] text-right font-medium text-[var(--ml-book-ink,#01193D)]">
            {serviceBits.join(" · ") || "—"}
          </dd>
        </div>

        {booking.scheduled_at ? (
          <div className="flex justify-between gap-4">
            <dt className="text-[var(--ml-book-ink-muted,#4a5568)]">When</dt>
            <dd className="max-w-[60%] text-right font-medium text-[var(--ml-book-ink,#01193D)]">
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
          <dt className="text-[var(--ml-book-ink-muted,#4a5568)]">Address</dt>
          <dd className="max-w-[60%] text-right font-medium text-[var(--ml-book-ink,#01193D)]">
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
            <dt className="text-[var(--ml-book-ink-muted,#4a5568)]">Unit</dt>
            <dd className="max-w-[60%] text-right font-medium text-[var(--ml-book-ink,#01193D)]">
              {unit}
            </dd>
          </div>
        ) : null}

        <div className="flex justify-between gap-4">
          <dt className="text-[var(--ml-book-ink-muted,#4a5568)]">Extras</dt>
          <dd className="max-w-[60%] text-right font-medium text-[var(--ml-book-ink,#01193D)]">
            {extras.length > 0 ? extras.join(", ") : "None"}
          </dd>
        </div>

        <div className="border-t border-[var(--ml-book-border,#e2e8f0)] pt-3">
          <dt className="text-[var(--ml-book-ink-muted,#4a5568)]">Today&apos;s clean</dt>
          <dd className="mt-2">
            <ul className="space-y-1.5">
              {tasks.map((task) => (
                <li
                  key={task}
                  className="flex items-start gap-2 text-[14px] text-[var(--ml-book-ink,#01193D)]"
                >
                  <span
                    className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[var(--ml-book-primary,#04CED2)]"
                    aria-hidden
                  />
                  <span>{task}</span>
                </li>
              ))}
            </ul>
          </dd>
        </div>

        <div className="flex justify-between gap-4 border-t border-[var(--ml-book-border,#e2e8f0)] pt-3">
          <dt className="text-[var(--ml-book-ink-muted,#4a5568)]">Total</dt>
          <dd className="font-semibold tabular-nums text-[var(--ml-book-ink,#01193D)]">
            {formatCurrency(booking.total_cents, booking.currency)}
          </dd>
        </div>

        <div className="flex justify-between gap-4">
          <dt className="text-[var(--ml-book-ink-muted,#4a5568)]">Payment</dt>
          <dd className="text-right font-medium text-[var(--ml-book-ink,#01193D)]">
            <span className="inline-flex items-center rounded-full bg-[var(--ml-book-selected,#E6FAFA)] px-2.5 py-0.5 text-xs font-semibold text-[var(--ml-book-primary,#04CED2)]">
              {paymentLabel(booking)}
            </span>
            {isPaidBookingStatus(booking.status) ? (
              <span className="mt-1 block text-xs font-normal text-[var(--ml-book-ink-muted,#4a5568)]">
                Deposit {formatCurrency(deposit, booking.currency)}
              </span>
            ) : null}
          </dd>
        </div>
      </dl>

      {showHelp ? (
        <div className="mt-4 flex flex-wrap gap-3 border-t border-[var(--ml-book-border,#e2e8f0)] pt-4 text-sm">
          <Link
            href={routes.dashboardSupport}
            className="font-semibold text-[var(--ml-book-primary,#04CED2)]"
          >
            Need help?
          </Link>
          <a
            href={siteConfig.links.support}
            className="font-semibold text-[var(--ml-book-ink-muted,#4a5568)]"
          >
            Email support
          </a>
        </div>
      ) : null}
    </section>
  );
}
