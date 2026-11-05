"use client";

import Link from "next/link";
import { CalendarDays, ChevronRight } from "lucide-react";
import { useActiveCustomerBooking } from "@/hooks/use-active-customer-booking";
import { getCustomerFriendlyStatusLabel } from "@/lib/bookings/status-timeline";
import { routes } from "@/config/site";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";

/**
 * Returning customers with a real upcoming booking see this first —
 * never invents a booking; only renders API rows.
 */
export function HomeActiveBookingCard({
  tone = "light",
  title = "Your booking",
  className,
}: {
  /** light — white card; dark — navy Overview surface */
  tone?: "light" | "dark";
  title?: string;
  className?: string;
} = {}) {
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
  const dark = tone === "dark";

  return (
    <section
      className={cn(
        dark
          ? "rounded-2xl border border-white/15 bg-[#0A2348] p-3.5 shadow-[0_12px_40px_rgba(0,0,0,0.28)]"
          : "rounded-2xl border border-[#08e0d4]/35 bg-white p-4 shadow-[0_8px_28px_rgb(0_52_116_/_0.08)]",
        className,
      )}
      aria-label="Your next clean"
    >
      <div className="flex items-start gap-3 text-left">
        <span
          className={
            dark
              ? "flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#04CED2]/15 text-[#04CED2]"
              : "flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#08e0d4]/15 text-[#003474]"
          }
        >
          <CalendarDays className="size-5" strokeWidth={2.25} aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p
            className={
              dark
                ? "text-[11px] font-semibold tracking-[0.16em] text-[#04CED2] uppercase"
                : "text-[11px] font-semibold tracking-[0.16em] text-[#08e0d4] uppercase"
            }
          >
            {title}
          </p>
          <p
            className={
              dark
                ? "mt-1 text-[15px] font-semibold text-white"
                : "mt-1 text-[15px] font-semibold text-[#003474]"
            }
          >
            {when}
          </p>
          {place ? (
            <p
              className={
                dark
                  ? "mt-0.5 truncate text-sm text-white/65"
                  : "mt-0.5 truncate text-sm text-slate-600"
              }
            >
              {place}
            </p>
          ) : null}
          <p className={dark ? "mt-1 text-sm text-white/60" : "mt-1 text-sm text-slate-600"}>
            {booking.serviceType.replace(/_/g, " ")}
            {booking.totalCents > 0
              ? ` · ${formatCurrency(booking.totalCents, booking.currency || "USD")}`
              : ""}
          </p>
          <p className="mt-1 text-xs font-semibold text-[#04CED2]">
            {getCustomerFriendlyStatusLabel(booking.status)}
          </p>
        </div>
        {dark ? (
          <Link
            href={routes.bookingStatus(booking.id)}
            className="mt-1 inline-flex shrink-0 text-[#04CED2]"
            aria-label="View booking"
          >
            <ChevronRight className="size-5" aria-hidden />
          </Link>
        ) : null}
      </div>
      <Link
        href={routes.bookingStatus(booking.id)}
        className={
          dark
            ? "mt-3 inline-flex h-11 w-full items-center justify-center rounded-xl border border-[#04CED2]/40 text-[15px] font-semibold text-[#04CED2] transition-opacity hover:opacity-95"
            : "booking-cta-btn mt-3 inline-flex h-12 w-full items-center justify-center rounded-2xl bg-[#04CED2] text-base font-semibold text-[#01193D] transition-opacity hover:opacity-95"
        }
      >
        View booking
      </Link>
    </section>
  );
}
