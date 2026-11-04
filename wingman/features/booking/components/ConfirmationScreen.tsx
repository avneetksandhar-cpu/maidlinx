"use client";

import { CheckIcon } from "@/components/icons";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import {
  BOOKING_STATUS_COPY,
  DEFAULT_BOOKING_REF,
  getBookingByRef,
  type StoredBooking,
} from "@/features/booking/storage";
import { assignedWingman } from "@/features/home/data/concierge";
import { fadeUpShort } from "@/lib/animations";
import { motion } from "framer-motion";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

const fadeUp = fadeUpShort;

export function ConfirmationScreen() {
  const params = useSearchParams();
  const ref = params.get("ref") ?? DEFAULT_BOOKING_REF;
  const [booking, setBooking] = useState<StoredBooking | undefined>();

  useEffect(() => {
    setBooking(getBookingByRef(ref));
  }, [ref]);

  const confirmed = booking?.status === "confirmed";

  return (
    <AppShell>
      <div className="flex flex-1 flex-col items-center justify-center px-2 text-center">
        <motion.div initial="hidden" animate="visible" className="flex w-full flex-col items-center">
          <motion.div
            custom={0}
            variants={fadeUp}
            className="flex h-24 w-24 items-center justify-center rounded-full bg-cobalt text-ink"
          >
            <CheckIcon className="h-10 w-10" />
          </motion.div>
          <motion.h1 custom={0.08} variants={fadeUp} className="mt-8 text-3xl tracking-tight text-ink">
            {confirmed ? "Booking confirmed" : "Request on file"}
          </motion.h1>
          <motion.p custom={0.16} variants={fadeUp} className="mt-3 max-w-sm text-sm text-ink-muted">
            {confirmed && booking
              ? `${booking.title} is confirmed for ${booking.guests} ${
                  booking.guests === 1 ? "guest" : "guests"
                }. This was a demo checkout — no card was charged.`
              : booking
                ? `${BOOKING_STATUS_COPY[booking.status].short}. A request is not a reservation.`
                : "No booking was found for this reference."}
          </motion.p>
          <motion.p
            custom={0.22}
            variants={fadeUp}
            className="mt-5 rounded-full border border-accent/40 px-4 py-1.5 text-sm tracking-[0.18em] text-accent"
          >
            {ref}
          </motion.p>
          {confirmed ? (
            <motion.p custom={0.26} variants={fadeUp} className="mt-4 max-w-sm text-sm text-ink-muted">
              {booking?.arrivalNote ?? assignedWingman.arrivalNote}
            </motion.p>
          ) : null}
          <motion.div custom={0.3} variants={fadeUp} className="mt-10 w-full">
            {confirmed ? (
              <Link href={`/ticket?ref=${ref}`} className="block">
                <Button size="lg" fullWidth>
                  View ticket
                </Button>
              </Link>
            ) : (
              <Link href={booking ? `/booking?ref=${booking.ref}` : "/home"} className="block">
                <Button size="lg" fullWidth>
                  {booking ? "Continue the request" : "Back home"}
                </Button>
              </Link>
            )}
            <Link href="/home" className="mt-4 block text-sm text-ink-muted hover:text-accent">
              Back to home
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </AppShell>
  );
}
