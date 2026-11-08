import Link from "next/link";
import { Building2, Home, Sparkles } from "lucide-react";
import { BookingMapStrip } from "@/components/customer/bookings/booking-map-strip";
import { BookingStatusPill } from "@/components/customer/bookings/booking-status-pill";
import type { DashboardBooking } from "@/lib/dashboard/bookings";
import {
  resolvePropertyLabel,
  serviceLabelForBooking,
} from "@/lib/dashboard/booking-labels";
import {
  formatArrivalWindowLabel,
  formatBookingDayShort,
} from "@/lib/dashboard/display";
import type { SavedAddress } from "@/lib/addresses/types";
import { routes } from "@/config/site";

export function NextCleanCard({
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
  const isBusiness =
    booking.propertyType === "business" ||
    booking.propertyType === "office" ||
    booking.serviceType === "office" ||
    /office|commercial|business/i.test(property);

  return (
    <article className="overflow-hidden rounded-[14px] border border-[#E2E8EE] bg-white shadow-[0_4px_18px_rgba(1,25,61,0.06)]">
      <BookingMapStrip
        latitude={booking.addressLatitude}
        longitude={booking.addressLongitude}
      />
      <div className="space-y-3 px-4 pb-4 pt-3.5">
        <BookingStatusPill status={booking.status} />
        <div>
          <p className="text-[1.35rem] font-bold leading-tight tracking-tight text-[#01193D]">
            {formatBookingDayShort(booking.scheduledAt)}
          </p>
          <p className="mt-0.5 text-[15px] font-medium text-[#01193D]/75">
            {formatArrivalWindowLabel(
              booking.scheduledAt,
              booking.arrivalWindowStart,
              booking.arrivalWindowEnd,
            )}
          </p>
        </div>
        <div className="space-y-1.5 text-[14px] text-[#01193D]/85">
          <p className="flex min-w-0 items-start gap-2">
            {isBusiness ? (
              <Building2 className="mt-0.5 size-4 shrink-0 text-[#01193D]/55" aria-hidden />
            ) : (
              <Home className="mt-0.5 size-4 shrink-0 text-[#01193D]/55" aria-hidden />
            )}
            <span className="min-w-0 break-words font-medium">{property}</span>
          </p>
          <p className="flex min-w-0 items-start gap-2">
            <Sparkles className="mt-0.5 size-4 shrink-0 text-[#01193D]/55" aria-hidden />
            <span className="min-w-0 break-words">{service}</span>
          </p>
        </div>
        <Link
          href={href}
          className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-[#04CED2] text-[15px] font-semibold text-[#01193D] transition-opacity hover:opacity-95"
        >
          View booking
        </Link>
      </div>
    </article>
  );
}
