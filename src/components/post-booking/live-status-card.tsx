"use client";

import Image from "next/image";
import { BookingMapPreview } from "@/components/booking/booking-map-preview";
import { LiveCleanerMap } from "@/components/booking/live-cleaner-map";
import { BookingStatusTimeline } from "@/components/booking/booking-status-timeline";
import {
  getCustomerStatusHeadline,
  getCustomerTimelineState,
} from "@/lib/bookings/status-timeline";
import { isLiveLocationStatus, normalizeBookingStatus } from "@/lib/bookings/status";
import type { StoredBooking } from "@/lib/bookings/repository";
import {
  formatBookingDate,
  formatBookingTimeRange,
} from "@/lib/dashboard/display";
import { getBookingServiceLabel } from "@/lib/bookings/constants";
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
  if (booking.arrival_window_start && booking.arrival_window_end) {
    return `Arrival window ${formatBookingTimeRange(
      booking.scheduled_at,
      booking.arrival_window_start,
      booking.arrival_window_end,
    )}`;
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

function nextStepCopy(booking: StoredBooking, finding: boolean): string {
  if (finding || !booking.cleaner) {
    return "We’ll notify you when someone accepts.";
  }
  const arrival = formatArrivalEstimate(booking);
  if (arrival) return arrival;
  return `${getBookingServiceLabel(booking.service_type)} is confirmed.`;
}

export function LiveStatusCard({ booking, accessToken, className }: LiveStatusCardProps) {
  const timeline = getCustomerTimelineState(booking.status);
  const headline = getCustomerStatusHeadline(booking.status);
  const addressLabel = [
    booking.address_line1,
    booking.address_city,
    booking.address_state,
  ]
    .filter(Boolean)
    .join(", ");
  const cleanerName = cleanerDisplayName(booking);
  const finding = timeline.findingProfessional || !booking.cleaner;
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
        "overflow-hidden rounded-2xl border border-[var(--ml-dark-border)] bg-[var(--ml-dark-surface,#102B49)] shadow-[var(--shadow-card)]",
        className,
      )}
    >
      <div className="space-y-2 px-4 pt-5 sm:px-5">
        <div className="flex justify-center">
          {finding ? (
            <span className="relative flex size-20 items-center justify-center">
              <span
                className="absolute inset-0 animate-ping rounded-full bg-[var(--ml-dark-mint,#04CED2)]/20"
                style={{ animationDuration: "1.8s" }}
                aria-hidden
              />
              <span className="relative flex size-16 items-center justify-center overflow-hidden rounded-full bg-[var(--ml-dark-bg,#01193D)] ring-2 ring-[var(--ml-dark-mint,#04CED2)]/40">
                <Image
                  src="/brand/maidlinx-mark.png"
                  alt="MaidLinx"
                  width={56}
                  height={56}
                  className="size-14 object-cover"
                  priority
                />
              </span>
            </span>
          ) : (
            <span
              className="flex size-14 items-center justify-center rounded-full bg-[var(--ml-dark-mint,#04CED2)] text-[var(--ml-app-header-ink,#01193D)]"
              aria-hidden
            >
              <span className="text-2xl font-bold leading-none">✓</span>
            </span>
          )}
        </div>

        <div className="text-center">
          <h2 className="mt-2 text-xl font-semibold tracking-tight text-white sm:text-[1.35rem]">
            {finding
              ? "Finding your cleaner"
              : cleanerName &&
                  (normalizeBookingStatus(booking.status) === "accepted" ||
                    normalizeBookingStatus(booking.status) === "assigned")
                ? `${cleanerName.split(" ")[0]} confirmed your clean`
                : cleanerName && normalizeBookingStatus(booking.status) === "on_the_way"
                  ? `${cleanerName.split(" ")[0]} is on the way`
                  : headline}
          </h2>
          <p className="mt-2 text-[14px] leading-relaxed text-[var(--ml-dark-ink-muted)]">
            {nextStepCopy(booking, finding)}
          </p>
          {booking.scheduled_at && !finding ? (
            <p className="mt-2 text-sm font-medium text-white">
              {formatBookingDate(booking.scheduled_at)}
              {" · "}
              {formatBookingTimeRange(
                booking.scheduled_at,
                booking.arrival_window_start,
                booking.arrival_window_end,
              )}
            </p>
          ) : null}
        </div>
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

      {finding ? (
        <div className="px-4 py-5 sm:px-5">
          <div className="flex items-center gap-3 rounded-xl border border-[var(--ml-dark-border)] bg-[var(--ml-dark-surface-2)] px-4 py-3">
            <span className="relative flex size-10 items-center justify-center">
              <span className="absolute inset-0 animate-ping rounded-full bg-[var(--ml-dark-mint,#04CED2)]/25" />
              <span className="relative flex size-8 items-center justify-center overflow-hidden rounded-full bg-[var(--ml-dark-bg)] ring-1 ring-white/20">
                <Image
                  src="/brand/maidlinx-mark.png"
                  alt=""
                  width={28}
                  height={28}
                  className="size-7 object-cover"
                />
              </span>
            </span>
            <div>
              <p className="text-sm font-semibold text-white">Finding your cleaner</p>
              <p className="text-sm text-[var(--ml-dark-ink-muted)]">
                Requested · card saved · charged after your clean.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3 px-4 py-4 sm:px-5">
          {booking.cleaner?.avatarUrl ? (
            <span className="relative size-12 shrink-0 overflow-hidden rounded-full ring-2 ring-[var(--ml-dark-mint,#04CED2)]/40">
              <Image
                src={booking.cleaner.avatarUrl}
                alt={cleanerName ?? "Your MaidLinx Pro"}
                width={48}
                height={48}
                className="size-12 object-cover"
              />
            </span>
          ) : (
            <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[var(--ml-dark-mint,#04CED2)]/15 text-sm font-bold text-[var(--ml-dark-mint,#04CED2)]">
              {(cleanerName ?? "P").charAt(0).toUpperCase()}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold text-white">
              {cleanerName ?? "Your MaidLinx Pro"}
            </p>
            <p className="truncate text-sm text-[var(--ml-dark-ink-muted)]">
              MaidLinx Pro
              {rating != null ? (
                <>
                  {" · "}
                  <span className="text-[var(--ml-dark-mint,#04CED2)]">★</span> {rating.toFixed(1)}
                </>
              ) : null}
              {jobCount != null ? ` (${jobCount} jobs)` : null}
            </p>
            <p className="mt-0.5 text-sm text-[var(--ml-dark-ink-muted)]">
              {getBookingServiceLabel(booking.service_type)} confirmed
            </p>
          </div>
        </div>
      )}

      <div className="border-t border-[var(--ml-dark-border)] px-3 py-4 sm:px-4">
        {!finding ? (
          <BookingStatusTimeline status={booking.status} variant="day_of" />
        ) : showLiveProgress ? (
          <BookingStatusTimeline status={booking.status} variant="live" />
        ) : (
          <BookingStatusTimeline status={booking.status} assignedDetail={cleanerName} />
        )}
      </div>
    </section>
  );
}
