"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CancelBookingDialog } from "@/components/dashboard/cancel-booking-dialog";
import { RescheduleBookingDialog } from "@/components/dashboard/reschedule-booking-dialog";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { Button, Card, CardContent } from "@/components/ui";
import type { DashboardBooking } from "@/lib/dashboard/bookings";
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

function buildRebookHref(booking: DashboardBooking): string {
  const params = new URLSearchParams({ rebook: "1" });
  if (booking.serviceType) params.set("serviceType", booking.serviceType);
  if (booking.addressLine1) params.set("line1", booking.addressLine1);
  if (booking.addressLine2) params.set("line2", booking.addressLine2);
  if (booking.addressCity) params.set("city", booking.addressCity);
  if (booking.addressState) params.set("state", booking.addressState);
  if (booking.addressPostalCode) params.set("postalCode", booking.addressPostalCode);
  if (booking.addressCountry) params.set("country", booking.addressCountry);
  return `${routes.book}?${params.toString()}`;
}

export function BookingCard({ booking, showActions = true }: BookingCardProps) {
  const router = useRouter();
  const [cancelOpen, setCancelOpen] = useState(false);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [favorited, setFavorited] = useState(false);
  const actionable = showActions && canCancelOrReschedule(booking.status, booking.scheduledAt);
  const completed = booking.status === "completed";

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
      <Card>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-display text-base font-semibold text-ink">
                {getServiceLabel(booking.serviceType)}
              </p>
              <p className="mt-1 text-sm text-ink-muted">
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
              <p className="text-ink-subtle">Address</p>
              <p className="text-ink">
                {formatAddress(booking.addressLine1, booking.addressCity, booking.addressState)}
              </p>
            </div>
            <div>
              <p className="text-ink-subtle">Total</p>
              <p className="font-medium text-ink">
                {formatBookingTotal(booking.totalCents, booking.currency)}
              </p>
            </div>
            {booking.professionalName && (
              <div>
                <p className="text-ink-subtle">Cleaner</p>
                <p className="text-ink">{booking.professionalName}</p>
              </div>
            )}
            {booking.invoiceNumber && (
              <div>
                <p className="text-ink-subtle">Invoice</p>
                <p className="font-mono text-sm text-ink">{booking.invoiceNumber}</p>
              </div>
            )}
          </div>

          {(actionable || booking.professionalProfileId || (showActions && completed)) && (
            <div className="flex flex-wrap gap-2 border-t border-border pt-4">
              {booking.professionalProfileId && !favorited && (
                <Button variant="ghost" size="sm" onClick={handleFavorite} disabled={favoriteLoading}>
                  {favoriteLoading ? "Saving..." : "Save favorite cleaner"}
                </Button>
              )}
              {favorited && (
                <span className="inline-flex items-center px-3 text-sm text-accent">Saved to favorites</span>
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
              {showActions && completed ? (
                <Link href={buildRebookHref(booking)}>
                  <Button variant="secondary" size="sm">
                    Book again
                  </Button>
                </Link>
              ) : null}
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
