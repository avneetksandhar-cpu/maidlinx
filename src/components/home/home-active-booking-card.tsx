"use client";

import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { useActiveCustomerBooking } from "@/hooks/use-active-customer-booking";
import { getCustomerFriendlyStatusLabel } from "@/lib/bookings/status-timeline";
import { routes } from "@/config/site";
import { formatCurrency } from "@/lib/utils";

/**
 * Returning customers with a real upcoming booking see this first —
 * never invents a booking; only renders API rows.
 */
export function HomeActiveBookingCard() {
  const { booking, loading } = useActiveCustomerBooking();

  if (loading || !booking) return null;

  const when = (() => {
    try {
      return new Date(booking.scheduledAt).toLocaleString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
    } catch {
      return booking.scheduledAt;
    }
  })();

  const place = [booking.addressLine1, booking.addressCity].filter(Boolean).join(", ");

  return (
    <section
      className="rounded-2xl border border-[#08e0d4]/35 bg-white p-4 shadow-[0_8px_28px_rgb(0_52_116_/_0.08)]"
      aria-label="Your active booking"
    >
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#08e0d4]/15 text-[#003474]">
          <CalendarDays className="size-5" strokeWidth={2.25} aria-hidden />
        </span>
        <div className="min-w-0 flex-1 text-left">
          <p className="text-[11px] font-semibold tracking-[0.16em] text-[#08e0d4] uppercase">
            Your booking
          </p>
          <p className="mt-1 text-[15px] font-semibold text-[#003474]">{when}</p>
          {place ? <p className="mt-0.5 truncate text-sm text-slate-600">{place}</p> : null}
          <p className="mt-1 text-sm text-slate-600">
            {booking.serviceType.replace(/_/g, " ")}
            {booking.totalCents > 0
              ? ` · ${formatCurrency(booking.totalCents, booking.currency || "USD")}`
              : ""}
          </p>
          <p className="mt-1 text-xs font-semibold text-[#04CED2]">
            {getCustomerFriendlyStatusLabel(booking.status)}
          </p>
        </div>
      </div>
      <Link
        href={routes.bookingStatus(booking.id)}
        className="booking-cta-btn mt-3 inline-flex h-12 w-full items-center justify-center rounded-2xl bg-[#04CED2] text-base font-semibold text-[#01193D] transition-opacity hover:opacity-95"
      >
        View booking
      </Link>
    </section>
  );
}
