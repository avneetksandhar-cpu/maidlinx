import Link from "next/link";
import type { DashboardBooking } from "@/lib/dashboard/bookings";
import type { StoredBooking } from "@/lib/bookings/repository";
import {
  formatAddress,
  formatBookingDate,
  formatBookingTimeRange,
  formatBookingTotal,
  getServiceLabel,
} from "@/lib/dashboard/display";
import { isPaidBookingStatus } from "@/lib/bookings/status";
import { formatCurrency } from "@/lib/utils";
import { routes } from "@/config/site";
import { cn } from "@/lib/utils";

type UpcomingSource =
  | DashboardBooking
  | {
      id: string;
      status: string;
      serviceType: string;
      scheduledAt: string;
      arrivalWindowStart: string | null;
      arrivalWindowEnd: string | null;
      totalCents: number;
      currency: string;
      addressLine1: string | null;
      addressCity: string | null;
      addressState: string | null;
    };

function fromStored(booking: StoredBooking): UpcomingSource {
  return {
    id: booking.id,
    status: booking.status,
    serviceType: booking.service_type,
    scheduledAt: booking.scheduled_at,
    arrivalWindowStart: booking.arrival_window_start,
    arrivalWindowEnd: booking.arrival_window_end,
    totalCents: booking.total_cents,
    currency: booking.currency,
    addressLine1: booking.address_line1,
    addressCity: booking.address_city,
    addressState: booking.address_state,
  };
}

interface UpcomingBookingCardProps {
  booking: DashboardBooking | StoredBooking;
  className?: string;
  showViewAll?: boolean;
}

function isStoredBooking(b: DashboardBooking | StoredBooking): b is StoredBooking {
  return "service_type" in b;
}

function formatRelativeDay(iso: string): string {
  const date = new Date(iso);
  const today = new Date();
  const startToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const startDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round((startDate.getTime() - startToday.getTime()) / 86_400_000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  return formatBookingDate(iso);
}

export function UpcomingBookingCard({
  booking,
  className,
  showViewAll = false,
}: UpcomingBookingCardProps) {
  const source = isStoredBooking(booking) ? fromStored(booking) : booking;
  const paid = isPaidBookingStatus(source.status);
  const href = routes.bookingDetail(source.id);

  return (
    <section className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold text-[var(--maidlinx-ink)]">
          Upcoming booking
        </h2>
        {showViewAll ? (
          <Link
            href={routes.dashboardBookings}
            className="text-sm font-medium text-[var(--maidlinx-green)] hover:text-[var(--maidlinx-green-dark)]"
          >
            View all ›
          </Link>
        ) : null}
      </div>

      <Link
        href={href}
        className="flex items-start gap-3 rounded-2xl border border-[var(--maidlinx-border)] bg-white p-4 shadow-soft transition-shadow hover:shadow-card"
      >
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[var(--maidlinx-mint)] text-[var(--maidlinx-green)]">
          <CalendarDollarIcon />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-[var(--maidlinx-ink)]">
            {formatRelativeDay(source.scheduledAt)} ·{" "}
            {formatBookingTimeRange(
              source.scheduledAt,
              source.arrivalWindowStart,
              source.arrivalWindowEnd,
            )}
          </p>
          <p className="mt-0.5 text-sm text-[var(--maidlinx-text)]">
            {getServiceLabel(source.serviceType)}
          </p>
          <p className="mt-0.5 truncate text-sm text-[var(--maidlinx-muted)]">
            {formatAddress(source.addressLine1, source.addressCity, source.addressState)}
          </p>
        </div>
        <div className="shrink-0 text-right">
          {paid ? (
            <span className="inline-flex rounded-full bg-[var(--maidlinx-mint)] px-2.5 py-0.5 text-xs font-semibold text-[var(--maidlinx-green)]">
              Paid
            </span>
          ) : null}
          <p className="mt-1 text-sm font-semibold tabular-nums text-[var(--maidlinx-ink)]">
            {isStoredBooking(booking)
              ? formatCurrency(source.totalCents, source.currency)
              : formatBookingTotal(source.totalCents, source.currency)}
          </p>
        </div>
      </Link>
    </section>
  );
}

function CalendarDollarIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.75" />
      <path d="M8 3v4M16 3v4M3 10h18" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      <path
        d="M12 13.2v4.2M10.5 14.2c.4-.6 1-.9 1.5-.9.9 0 1.5.5 1.5 1.2s-.6 1.2-1.5 1.2-1.5.5-1.5 1.2c0 .7.7 1.2 1.5 1.2.6 0 1.2-.3 1.5-.9"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
