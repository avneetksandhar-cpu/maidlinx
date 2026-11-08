import Link from "next/link";
import { Building2, Home, Sparkles } from "lucide-react";
import { BookingStatusPill } from "@/components/customer/bookings/booking-status-pill";
import type { DashboardBooking } from "@/lib/dashboard/bookings";
import {
  buildRebookHref,
  resolvePropertyLabel,
  serviceLabelForBooking,
} from "@/lib/dashboard/booking-labels";
import { formatBookingDayShort, formatBookingTotal } from "@/lib/dashboard/display";
import type { SavedAddress } from "@/lib/addresses/types";
import { routes } from "@/config/site";

export function PastBookingCard({
  booking,
  sites,
  detailHref,
}: {
  booking: DashboardBooking;
  sites: SavedAddress[];
  detailHref?: string;
}) {
  const href = detailHref ?? routes.dashboardBooking(booking.id);
  const property = resolvePropertyLabel(booking, sites);
  const service = serviceLabelForBooking(booking);
  const completed = booking.status === "completed";
  const hasReceipt = Boolean(booking.stripeReceiptUrl?.trim());
  const isBusiness =
    booking.propertyType === "business" ||
    booking.propertyType === "office" ||
    booking.serviceType === "office" ||
    /office|commercial|business/i.test(property);

  return (
    <article className="rounded-[14px] border border-[#E2E8EE] bg-white px-4 py-4 shadow-[0_2px_12px_rgba(1,25,61,0.04)]">
      <div className="flex items-start justify-between gap-3">
        <p className="flex min-w-0 items-start gap-2 text-[15px] font-bold text-[#01193D]">
          {isBusiness ? (
            <Building2 className="mt-0.5 size-4 shrink-0 text-[#01193D]/55" aria-hidden />
          ) : (
            <Home className="mt-0.5 size-4 shrink-0 text-[#01193D]/55" aria-hidden />
          )}
          <span className="min-w-0 break-words">{property}</span>
        </p>
        <BookingStatusPill status={booking.status} className="shrink-0" />
      </div>

      <p className="mt-2.5 flex min-w-0 items-start gap-2 text-[14px] text-[#01193D]/8">
        <Sparkles className="mt-0.5 size-4 shrink-0 text-[#01193D]/5" aria-hidden />
        <span className="min-w-0 break-words">{service}</span>
      </p>

      <div className="mt-3 flex items-baseline justify-between gap-3">
        <p className="text-[14px] font-medium text-[#01193D]/7">
          {formatBookingDayShort(booking.scheduledAt)}
        </p>
        <p className="text-[15px] font-bold tabular-nums text-[#01193D]">
          {formatBookingTotal(booking.totalCents, booking.currency)}
        </p>
      </div>

      {completed ? (
        <div className="mt-4 grid grid-cols-2 gap-2.5">
          {hasReceipt ? (
            <a
              href={booking.stripeReceiptUrl!}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-11 items-center justify-center rounded-xl border border-[#D8DEE6] bg-white text-[14px] font-semibold text-[#01193D] transition-colors hover:bg-[#F8FAFC]"
            >
              View receipt
            </a>
          ) : (
            <Link
              href={href}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-[#D8DEE6] bg-white text-[14px] font-semibold text-[#01193D] transition-colors hover:bg-[#F8FAFC]"
            >
              View booking
            </Link>
          )}
          <Link
            href={buildRebookHref(booking)}
            className="inline-flex h-11 items-center justify-center rounded-xl bg-[#04CED2] text-[14px] font-semibold text-[#01193D] transition-opacity hover:opacity-95"
          >
            Book again
          </Link>
        </div>
      ) : (
        <Link
          href={href}
          className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-xl border border-[#D8DEE6] text-[14px] font-semibold text-[#01193D]"
        >
          View booking
        </Link>
      )}
    </article>
  );
}
