"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Building2,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  DoorOpen,
  Home,
  MapPin,
} from "lucide-react";
import { CustomerMarketHeader } from "@/components/customer/customer-market-header";
import { CustomerBottomNav } from "@/components/customer/customer-bottom-nav";
import { BookingStatusPill } from "@/components/customer/bookings/booking-status-pill";
import { EntryInstructionsDialog } from "@/components/customer/bookings/entry-instructions-dialog";
import { RescheduleBookingDialog } from "@/components/dashboard/reschedule-booking-dialog";
import type { DashboardBooking } from "@/lib/dashboard/bookings";
import {
  formatFullAddress,
  isRecurringBooking,
  resolvePropertyLabel,
  serviceLabelForBooking,
} from "@/lib/dashboard/booking-labels";
import {
  canCancelOrReschedule,
  cleanerInitials,
  formatArrivalWindowLabel,
  formatBookingDayShort,
  formatBookingTimeRange,
  formatBookingTotal,
  formatCleanerShortName,
} from "@/lib/dashboard/display";
import type { SavedAddress } from "@/lib/addresses/types";
import { routes } from "@/config/site";
import { cn } from "@/lib/utils";

export function BookingDetailScreen({
  booking,
  sites,
  fromTab = "upcoming",
  entryScopeHref = null,
}: {
  booking: DashboardBooking;
  sites: SavedAddress[];
  fromTab?: "upcoming" | "past";
  entryScopeHref?: string | null;
}) {
  const [entryOpen, setEntryOpen] = useState(false);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);

  const property = resolvePropertyLabel(booking, sites);
  const address = formatFullAddress(booking);
  const service = serviceLabelForBooking(booking);
  const cleanerName = formatCleanerShortName(booking.professionalName);
  const canReschedule = canCancelOrReschedule(booking.status, booking.scheduledAt);
  const recurring = isRecurringBooking(booking);
  const backHref = `${routes.dashboardBookings}?tab=${fromTab}`;
  const isBusiness =
    booking.propertyType === "business" ||
    booking.propertyType === "office" ||
    booking.serviceType === "office" ||
    /office|commercial|business/i.test(property);

  const arrivalShort = useMemo(
    () =>
      formatBookingTimeRange(
        booking.scheduledAt,
        booking.arrivalWindowStart,
        booking.arrivalWindowEnd,
      )
        .replace(/\s+/g, " ")
        .replace(" – ", "–")
        .replace(" - ", "–"),
    [booking],
  );

  const helpHref = `${routes.dashboardSupport}?booking=${encodeURIComponent(booking.id)}`;

  return (
    <div
      className="relative flex min-h-dvh flex-col overflow-x-hidden bg-white text-[#01193D]"
      style={{ fontFamily: "var(--ml-font-ios)" }}
    >
      <CustomerMarketHeader homeHref={routes.home} />

      <main className="relative z-10 mx-auto w-full max-w-md flex-1 px-5 pb-[calc(5.25rem+env(safe-area-inset-bottom))] pt-4">
        <Link
          href={backHref}
          className="inline-flex items-center gap-0.5 text-[15px] font-semibold text-[#01193D]"
        >
          <ChevronLeft className="size-5" strokeWidth={2.25} aria-hidden />
          Bookings
        </Link>

        <h1 className="mt-3 text-[1.85rem] font-bold tracking-tight text-[#01193D]">
          Booking details
        </h1>

        <div className="mt-5 flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#F1F5F9] text-[#01193D]">
                {isBusiness ? (
                  <Building2 className="size-[18px]" aria-hidden />
                ) : (
                  <Home className="size-[18px]" aria-hidden />
                )}
              </span>
              <p className="min-w-0 break-words text-[1.05rem] font-bold leading-snug text-[#01193D]">
                {property}
              </p>
            </div>
            <p className="mt-2 flex min-w-0 items-start gap-1.5 text-[14px] text-[#5A6578]">
              <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden />
              <span className="min-w-0 break-words">{address}</span>
            </p>
          </div>
          <BookingStatusPill status={booking.status} className="shrink-0" />
        </div>

        <dl className="mt-6 divide-y divide-[#E8ECF0] border-y border-[#E8ECF0]">
          <DetailRow label="Date" value={formatBookingDayShort(booking.scheduledAt)} />
          <DetailRow label="Arrival" value={arrivalShort} />
          <DetailRow label="Service" value={service} />
          <DetailRow
            label="Total"
            value={formatBookingTotal(booking.totalCents, booking.currency)}
            strong
          />
        </dl>

        {recurring ? (
          <p className="mt-3 rounded-xl bg-[#F4F7FA] px-3 py-2.5 text-[13px] leading-snug text-[#5A6578]">
            Recurring series · actions below apply to this visit on{" "}
            <span className="font-semibold text-[#01193D]">
              {formatBookingDayShort(booking.scheduledAt)}
            </span>{" "}
            (
            {formatArrivalWindowLabel(
              booking.scheduledAt,
              booking.arrivalWindowStart,
              booking.arrivalWindowEnd,
            )}
            ).
          </p>
        ) : null}

        <div className="mt-5 flex items-center gap-3 rounded-[14px] border border-[#E2E8EE] bg-white px-4 py-3.5">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#04CED2] text-[13px] font-bold text-[#01193D]">
            {cleanerName ? cleanerInitials(booking.professionalName) : "—"}
          </span>
          <div className="min-w-0">
            <p className="text-[12px] font-medium text-[#8A93A3]">Your cleaner</p>
            <p className="truncate text-[15px] font-bold text-[#01193D]">
              {cleanerName ?? "Awaiting assignment"}
            </p>
          </div>
        </div>

        <div className="mt-4 overflow-hidden rounded-[14px] border border-[#E2E8EE]">
          <ActionRow
            icon={<DoorOpen className="size-5" strokeWidth={1.75} aria-hidden />}
            label="Entry instructions"
            onClick={() => setEntryOpen(true)}
          />
          <ActionRow
            icon={<CalendarDays className="size-5" strokeWidth={1.75} aria-hidden />}
            label="Reschedule visit"
            disabled={!canReschedule}
            hint={
              !canReschedule
                ? "Reschedule is available until 24 hours before arrival"
                : recurring
                  ? `Changes this visit · ${formatBookingDayShort(booking.scheduledAt)}`
                  : undefined
            }
            onClick={() => setRescheduleOpen(true)}
          />
          <ActionRow
            icon={<CircleHelp className="size-5" strokeWidth={1.75} aria-hidden />}
            label="Get help"
            href={helpHref}
          />
        </div>
      </main>

      <CustomerBottomNav />

      <EntryInstructionsDialog
        bookingId={booking.id}
        initialNotes={booking.notes ?? ""}
        open={entryOpen}
        onOpenChange={setEntryOpen}
        scopeHref={entryScopeHref}
      />
      <RescheduleBookingDialog
        bookingId={booking.id}
        open={rescheduleOpen}
        onOpenChange={setRescheduleOpen}
        visitLabel={formatBookingDayShort(booking.scheduledAt)}
        arrivalLabel={arrivalShort}
        recurring={recurring}
      />
    </div>
  );
}

function DetailRow({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-3.5">
      <dt className="text-[14px] text-[#8A93A3]">{label}</dt>
      <dd
        className={cn(
          "max-w-[65%] text-right text-[15px] text-[#01193D]",
          strong ? "font-bold tabular-nums" : "font-medium",
        )}
      >
        {value}
      </dd>
    </div>
  );
}

function ActionRow({
  icon,
  label,
  href,
  onClick,
  disabled,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
  hint?: string;
}) {
  const inner = (
    <>
      <span className="text-[#01193D]/7">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-semibold text-[#01193D]">{label}</span>
        {hint ? (
          <span className="mt-0.5 block text-[12px] font-medium text-[#8A93A3]">{hint}</span>
        ) : null}
      </span>
      <ChevronRight className="size-5 shrink-0 text-[#C5CAD3]" aria-hidden />
    </>
  );

  const className = cn(
    "flex w-full items-center gap-3 border-b border-[#E8ECF0] bg-white px-4 py-4 text-left last:border-0",
    disabled && "cursor-not-allowed opacity-45",
  );

  if (href && !disabled) {
    return (
      <Link href={href} className={className}>
        {inner}
      </Link>
    );
  }

  return (
    <button type="button" className={className} disabled={disabled} onClick={onClick}>
      {inner}
    </button>
  );
}
