"use client";

import { QrCode } from "@/components/app/QrCode";
import { WingmanLogo } from "@/components/brand/WingmanLogo";
import { AppHeader } from "@/components/layout/AppHeader";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import {
  BOOKING_STATUS_COPY,
  DEFAULT_BOOKING_REF,
  getBookingByRef,
  type StoredBooking,
} from "@/features/booking/storage";
import { assignedWingman } from "@/features/home/data/concierge";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export function TicketScreen({ bookingRef }: { bookingRef?: string }) {
  const params = useSearchParams();
  const ref = bookingRef ?? params.get("ref") ?? DEFAULT_BOOKING_REF;
  const [booking, setBooking] = useState<StoredBooking | undefined>();

  useEffect(() => {
    setBooking(getBookingByRef(ref));
  }, [ref]);

  if (!booking || booking.status !== "confirmed") {
    return (
      <AppShell showNav>
        <AppHeader title="Ticket" showBack backHref="/bookings" />
        <div className="flex flex-1 flex-col justify-center text-center">
          <h1 className="text-2xl text-ink">No ticket yet</h1>
          <p className="mt-3 text-sm leading-relaxed text-ink-muted">
            {booking
              ? `${BOOKING_STATUS_COPY[booking.status].short}. A ticket is issued only after the booking is confirmed.`
              : "There is no confirmed booking for this reference."}
          </p>
          <Link href={booking ? `/booking?ref=${booking.ref}` : "/home"} className="mt-6">
            <Button fullWidth>{booking ? "Continue the request" : "Back home"}</Button>
          </Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell showNav>
      <AppHeader title="Your ticket" showBack backHref="/bookings" />

      <div className="rounded-[1.6rem] border border-accent/35 bg-surface p-5">
        <div className="flex items-center justify-between">
          <WingmanLogo size={36} />
          <span className="text-[10px] uppercase tracking-[0.22em] text-accent">{booking.ref}</span>
        </div>

        <div className="mt-5 flex justify-center rounded-2xl bg-ivory p-4">
          <QrCode value={booking.ref} size={196} />
        </div>

        <h1 className="mt-5 text-center text-2xl text-ink">{booking.title}</h1>
        <p className="mt-1 text-center text-sm text-ink-muted">{booking.venue}</p>
        <p className="mt-2 text-center text-xs text-accent">Demo ticket — not venue entry</p>

        <dl className="mt-5 grid grid-cols-2 gap-3 text-center">
          <div className="rounded-xl border border-border bg-background px-3 py-3">
            <dt className="text-[10px] uppercase tracking-[0.16em] text-ink-subtle">Date</dt>
            <dd className="mt-1 text-sm text-ink">{booking.dateLabel}</dd>
          </div>
          <div className="rounded-xl border border-border bg-background px-3 py-3">
            <dt className="text-[10px] uppercase tracking-[0.16em] text-ink-subtle">Time</dt>
            <dd className="mt-1 text-sm text-ink">{booking.timeLabel}</dd>
          </div>
          <div className="col-span-2 rounded-xl border border-border bg-background px-3 py-3">
            <dt className="text-[10px] uppercase tracking-[0.16em] text-ink-subtle">Guests</dt>
            <dd className="mt-1 text-sm text-ink">
              {booking.guests} {booking.guests === 1 ? "guest" : "guests"}
            </dd>
          </div>
        </dl>

        <p className="mt-5 text-center text-xs leading-relaxed text-ink-muted">
          {booking.arrivalNote ?? assignedWingman.arrivalNote}
        </p>
        <p className="mt-2 text-center text-xs text-ink-subtle">
          {booking.contactName ?? assignedWingman.firstName} ·{" "}
          {booking.contactDetail ?? assignedWingman.contactNote}
        </p>
      </div>
    </AppShell>
  );
}
