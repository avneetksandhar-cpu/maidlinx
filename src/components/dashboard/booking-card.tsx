"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CancelBookingDialog } from "@/components/dashboard/cancel-booking-dialog";
import { RescheduleBookingDialog } from "@/components/dashboard/reschedule-booking-dialog";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { Button, Card, CardContent } from "@/components/ui";
import type { DashboardBooking } from "@/lib/dashboard/bookings";
import { buildRebookHref } from "@/lib/dashboard/booking-labels";
import {
  canCancelOrReschedule,
  formatAddress,
  formatBookingDate,
  formatBookingTimeRange,
  formatBookingTotal,
  getServiceLabel,
} from "@/lib/dashboard/display";
import { routes } from "@/config/site";

interface BookingCardProps {
  booking: DashboardBooking;
  showActions?: boolean;
}

export function BookingCard({ booking, showActions = true }: BookingCardProps) {
  const router = useRouter();
  const [cancelOpen, setCancelOpen] = useState(false);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [favorited, setFavorited] = useState(false);
  const actionable = showActions && canCancelOrReschedule(booking.status, booking.scheduledAt);
  const completed = booking.status === "completed";
  const showBookAgain = completed;

  async function handleFavorite() {
    if (!booking.professionalProfileId) return;
    setFavoriteLoading(true);
    try {
      const response = await fetch("/api/dashboard/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ professionalProfileId: booking.professionalProfileId }),
      });
      if (response.ok) {
        setFavorited(true);
        router.refresh();
      }
    } finally {
      setFavoriteLoading(false);
    }
  }

  return (
    <>
      <Card className="border-[var(--ml-dark-border)] bg-[var(--ml-dark-surface)] shadow-[var(--shadow-soft)]">
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <Link
                href={routes.bookingDetail(booking.id)}
                className="font-display text-base font-semibold text-white hover:underline"
              >
                {getServiceLabel(booking.serviceType)}
              </Link>
              <p className="mt-1 text-sm text-[var(--ml-dark-ink-muted)]">
                {formatBookingDate(booking.scheduledAt)} ·{" "}
                {formatBookingTimeRange(
                  booking.scheduledAt,
                  booking.arrivalWindowStart,
                  booking.arrivalWindowEnd,
                )}
              </p>
            </div>
            <StatusBadge status={booking.status} />
          </div>

          <div className="grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <p className="text-[var(--ml-dark-ink-subtle)]">Address</p>
              <p className="text-white">
                {formatAddress(booking.addressLine1, booking.addressCity, booking.addressState)}
              </p>
            </div>
            <div>
              <p className="text-[var(--ml-dark-ink-subtle)]">Total</p>
              <p className="font-medium text-white">
                {formatBookingTotal(booking.totalCents, booking.currency)}
              </p>
            </div>
            {booking.professionalName && (
              <div>
                <p className="text-[var(--ml-dark-ink-subtle)]">Cleaner</p>
                <p className="text-white">{booking.professionalName}</p>
              </div>
            )}
            {booking.invoiceNumber && (
              <div>
                <p className="text-[var(--ml-dark-ink-subtle)]">Invoice</p>
                <p className="font-mono text-sm text-white">{booking.invoiceNumber}</p>
              </div>
            )}
          </div>

          {(actionable || booking.professionalProfileId || showBookAgain) && (
            <div className="flex flex-wrap gap-2 border-t border-[var(--ml-dark-border)] pt-4">
              {completed && booking.professionalProfileId && !favorited && (
                <Button variant="ghost" size="sm" onClick={handleFavorite} disabled={favoriteLoading}>
                  {favoriteLoading ? "Saving..." : "Prefer this Pro"}
                </Button>
              )}
              {favorited && (
                <span className="inline-flex items-center px-3 text-sm text-[var(--ml-dark-mint)]">
                  Preference saved — assigned when available
                </span>
              )}
              {actionable && (
                <>
                  <Button variant="secondary" size="sm" onClick={() => setRescheduleOpen(true)}>
                    Reschedule
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setCancelOpen(true)}>
                    Cancel booking
                  </Button>
                </>
              )}
              {showBookAgain ? (
                <Link href={buildRebookHref(booking)}>
                  <Button variant="accent" size="sm">
                    Book again
                  </Button>
                </Link>
              ) : null}
              <Link href={routes.bookingDetail(booking.id)}>
                <Button variant="ghost" size="sm">
                  View booking
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      <CancelBookingDialog
        bookingId={booking.id}
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        onSuccess={() => router.refresh()}
      />
      <RescheduleBookingDialog
        bookingId={booking.id}
        open={rescheduleOpen}
        onOpenChange={setRescheduleOpen}
        onSuccess={() => router.refresh()}
      />
    </>
  );
}
