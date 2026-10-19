"use client";

import { BookingMapPreview } from "@/components/booking/booking-map-preview";
import { LiveCleanerMap } from "@/components/booking/live-cleaner-map";
import { BookingStatusTimeline } from "@/components/booking/booking-status-timeline";
import {
  getCustomerStatusHeadline,
  getCustomerTimelineState,
} from "@/lib/bookings/status-timeline";
import { isLiveLocationStatus, normalizeBookingStatus } from "@/lib/bookings/status";
import type { StoredBooking } from "@/lib/bookings/repository";
import { cn } from "@/lib/utils";

interface LiveStatusCardProps {
  booking: StoredBooking;
  accessToken?: string | null;
  className?: string;
}

function formatArrivalEstimate(booking: StoredBooking): string | null {
  // Only surface real ETA / window from backend — never invent.
  if (booking.estimated_eta_minutes != null && Number.isFinite(booking.estimated_eta_minutes)) {
    const arrive = new Date(Date.now() + booking.estimated_eta_minutes * 60_000);
    return `Arriving around ${arrive.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
  }
  if (booking.arrival_window_start) {
    const start = new Date(booking.arrival_window_start);
    if (!Number.isNaN(start.getTime())) {
      return `Window starts ${start.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
    }
  }
  return null;
}

function cleanerDisplayName(booking: StoredBooking): string | null {
  if (!booking.cleaner) return null;
  const first = booking.cleaner.firstName?.trim();
  const last = booking.cleaner.lastName?.trim();
  if (first && last) return `${first} ${last.charAt(0)}.`;
  if (first) return first;
  if (last) return last;
  return null;
}

function showsLiveProgress(status: string): boolean {
  const normalized = normalizeBookingStatus(status);
  return (
    normalized === "on_the_way" ||
    normalized === "arrived" ||
    normalized === "in_progress" ||
    normalized === "completed"
  );
}

export function LiveStatusCard({ booking, accessToken, className }: LiveStatusCardProps) {
  const timeline = getCustomerTimelineState(booking.status);
  const headline = getCustomerStatusHeadline(booking.status);
  const arrival = formatArrivalEstimate(booking);
  const addressLabel = [
    booking.address_line1,
    booking.address_city,
    booking.address_state,
  ]
    .filter(Boolean)
    .join(", ");
  const cleanerName = cleanerDisplayName(booking);
  const showLiveMap = isLiveLocationStatus(booking.status);
  const showLiveProgress = showsLiveProgress(booking.status);
  const rating =
    booking.cleaner?.ratingAverage != null && Number.isFinite(booking.cleaner.ratingAverage)
      ? booking.cleaner.ratingAverage
      : null;
  const jobCount =
    booking.cleaner?.ratingCount != null && booking.cleaner.ratingCount > 0
      ? booking.cleaner.ratingCount
      : null;

  return (
    <section
      className={cn(
        "overflow-hidden rounded-2xl border border-[var(--ml-dark-border)] bg-[var(--ml-dark-surface)] shadow-[var(--shadow-card)]",
        className,
      )}
    >
      <div className="space-y-1 px-4 pt-4 sm:px-5">
        <p className="inline-flex items-center gap-1.5 rounded-full bg-[var(--ml-dark-mint)]/15 px-2.5 py-0.5 text-[11px] font-semibold tracking-wide text-[var(--ml-dark-mint)] uppercase">
          <span className="size-1.5 rounded-full bg-[var(--ml-dark-mint)]" aria-hidden />
          Live status
        </p>
        <h2 className="text-xl font-semibold tracking-tight text-white">{headline}</h2>
        {arrival && !timeline.findingProfessional ? (
          <p className="text-sm text-[var(--ml-dark-ink-muted)]">{arrival}</p>
        ) : null}
      </div>

      <div className="mt-4 px-4 sm:px-5">
        {showLiveMap ? (
          <LiveCleanerMap
            bookingId={booking.id}
            accessToken={accessToken}
            status={booking.status}
            customerLat={booking.address_latitude}
            customerLng={booking.address_longitude}
            addressLabel={addressLabel || "Your location"}
            className="border-0 shadow-none"
            showHeader={false}
          />
        ) : (
          <BookingMapPreview
            latitude={booking.address_latitude}
            longitude={booking.address_longitude}
            label={addressLabel || "Your location"}
          />
        )}
      </div>

      {timeline.findingProfessional || !booking.cleaner ? (
        <div className="px-4 py-5 sm:px-5">
          <div className="flex items-center gap-3 rounded-xl border border-[var(--ml-dark-border)] bg-[var(--ml-dark-surface-2)] px-4 py-3">
            <span className="relative flex size-10 items-center justify-center">
              <span className="absolute inset-0 animate-ping rounded-full bg-[var(--ml-dark-mint)]/20" />
              <span className="relative flex size-8 items-center justify-center rounded-full bg-[var(--ml-dark-mint)] text-sm font-bold text-[var(--color-accent-foreground)]">
                ML
              </span>
            </span>
            <div>
              <p className="text-sm font-semibold text-white">Finding your MaidLinx Pro…</p>
              <p className="text-sm text-[var(--ml-dark-ink-muted)]">
                We’ll show your cleaner here as soon as they’re assigned.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3 px-4 py-4 sm:px-5">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[var(--ml-dark-mint)]/15 text-sm font-bold text-[var(--ml-dark-mint)]">
            {(cleanerName ?? "P").charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold text-white">
              {cleanerName ?? "Your MaidLinx Pro"}
            </p>
            <p className="truncate text-sm text-[var(--ml-dark-ink-muted)]">
              MaidLinx Pro
              {rating != null ? (
                <>
                  {" · "}
                  <span className="text-[var(--ml-dark-mint)]">★</span> {rating.toFixed(1)}
                </>
              ) : null}
              {jobCount != null ? ` (${jobCount} jobs)` : null}
            </p>
          </div>
          {/* Message / Call / Track full trip hidden until productized */}
        </div>
      )}

      <div className="border-t border-[var(--ml-dark-border)] px-3 py-4 sm:px-4">
        {showLiveProgress ? (
          <BookingStatusTimeline status={booking.status} variant="live" />
        ) : (
          <BookingStatusTimeline status={booking.status} />
        )}
      </div>
    </section>
  );
}
