import Link from "next/link";
import { CalendarDays } from "lucide-react";
import type { DashboardBooking } from "@/lib/dashboard/bookings";
import { resolvePropertyLabel } from "@/lib/dashboard/booking-labels";
import type { SavedAddress } from "@/lib/addresses/types";
import { routes } from "@/config/site";

export function LaterVisitRow({
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
  const date = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(booking.scheduledAt));

  return (
    <Link
      href={href}
      className="flex min-w-0 items-center gap-3 rounded-[12px] border border-[#E2E8EE] bg-white px-3.5 py-3.5 transition-colors hover:bg-[#F8FAFC] active:bg-[#F1F5F9]"
    >
      <CalendarDays className="size-5 shrink-0 text-[#01193D]/55" strokeWidth={1.75} aria-hidden />
      <span className="min-w-0 flex-1 truncate text-[15px] font-semibold text-[#01193D]">
        <span className="tabular-nums">{date}</span>
        <span className="font-medium text-[#01193D]/45"> · </span>
        <span>{property}</span>
      </span>
    </Link>
  );
}
