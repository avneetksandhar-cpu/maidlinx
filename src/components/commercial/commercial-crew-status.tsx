"use client";

import Link from "next/link";
import { Building2, MapPin, MessageCircle } from "lucide-react";
import { LiveCleanerMap } from "@/components/booking/live-cleaner-map";
import { CommercialCtaButton } from "@/components/commercial/commercial-book-chrome";
import { isLiveLocationStatus, normalizeBookingStatus } from "@/lib/bookings/status";
import type { DashboardBooking } from "@/lib/dashboard/bookings";
import { routes } from "@/config/site";

interface CommercialCrewStatusProps {
  job: DashboardBooking;
  siteLabel?: string | null;
  /** Entry / access notes only when present on real scope — never invented. */
  entryInstructionsHref?: string | null;
  /** Live map only when cleaner is on_the_way/arrived AND consented location may exist. */
  showLiveMapEligible: boolean;
  accessToken?: string | null;
  customerLat?: number | null;
  customerLng?: number | null;
}

function arrivalHeadline(job: DashboardBooking): string {
  const status = normalizeBookingStatus(job.status);
  if (status === "arrived") return "Your crew has arrived";
  if (status === "in_progress") return "Cleaning in progress";
  if (status === "completed") return "Clean completed";
  if (status === "on_the_way") {
    if (job.arrivalWindowStart) {
      const start = new Date(job.arrivalWindowStart);
      if (!Number.isNaN(start.getTime())) {
        return `Arriving at ${start.toLocaleTimeString([], {
          hour: "numeric",
          minute: "2-digit",
        })}`;
      }
    }
    return "Your crew is on the way";
  }
  if (job.arrivalWindowStart) {
    const start = new Date(job.arrivalWindowStart);
    if (!Number.isNaN(start.getTime())) {
      return `Scheduled for ${start.toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
      })}`;
    }
  }
  const scheduled = new Date(job.scheduledAt);
  if (!Number.isNaN(scheduled.getTime())) {
    return `Scheduled ${scheduled.toLocaleString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    })}`;
  }
  return "Visit confirmed";
}

/**
 * Screen C — truthful crew status from real booking.
 * Map/route/ETA only when live-location status + consented share path; otherwise status drawer only.
 */
export function CommercialCrewStatus({
  job,
  siteLabel,
  entryInstructionsHref,
  showLiveMapEligible,
  accessToken,
  customerLat,
  customerLng,
}: CommercialCrewStatusProps) {
  const teamName = job.professionalName?.trim() || "Crew assigning…";
  const place =
    siteLabel?.trim() ||
    [job.addressLine1, job.addressLine2].filter(Boolean).join(" · ") ||
    "Site";
  const live = showLiveMapEligible && isLiveLocationStatus(job.status);
  const addressLabel = [job.addressLine1, job.addressCity, job.addressState]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="mx-auto w-full max-w-[390px] space-y-4 lg:max-w-[430px]">
      <header className="space-y-2">
        <Link
          href={routes.dashboardJobs}
          className="inline-flex text-sm font-semibold text-[#04CED2]"
        >
          ← Jobs
        </Link>
        <h1 className="text-[1.75rem] leading-tight font-bold tracking-tight text-white">
          {normalizeBookingStatus(job.status) === "on_the_way"
            ? "Your crew is on the way"
            : arrivalHeadline(job)}
        </h1>
      </header>

      {live ? (
        <div className="overflow-hidden rounded-2xl border border-white/10">
          <LiveCleanerMap
            bookingId={job.id}
            accessToken={accessToken}
            status={job.status}
            customerLat={customerLat}
            customerLng={customerLng}
            addressLabel={addressLabel || place}
            showHeader={false}
            className="aspect-[16/11] min-h-[180px]"
          />
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-white/15 bg-[var(--ml-dark-surface)] px-4 py-6 text-center">
          <MapPin className="mx-auto size-6 text-[#04CED2]" aria-hidden />
          <p className="mt-2 text-sm font-semibold text-white">Live map unavailable</p>
          <p className="mt-1 text-sm text-[var(--ml-dark-ink-muted)]">
            {isLiveLocationStatus(job.status)
              ? "Waiting for your crew to share a consented live location. We never show a simulated route."
              : "Map and ETA appear only while the crew is on the way or arrived and sharing location."}
          </p>
        </div>
      )}

      <div className="rounded-2xl border border-white/10 bg-[var(--ml-dark-surface,#102B49)] px-4 py-4 shadow-[var(--shadow-soft)]">
        <p className="text-[1.35rem] font-bold tracking-tight text-white">
          {arrivalHeadline(job)}
        </p>
        <div className="mt-4 space-y-3">
          <div className="flex items-center gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#04CED2]/15 text-[#04CED2]">
              <Building2 className="size-4" aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="truncate text-[15px] font-semibold text-white">{teamName}</p>
              <p className="text-xs text-white/55">
                Status · {job.status.replaceAll("_", " ")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#04CED2]/15 text-[#04CED2]">
              <MapPin className="size-4" aria-hidden />
            </span>
            <p className="truncate text-[15px] font-medium text-white">{place}</p>
          </div>
          {entryInstructionsHref ? (
            <Link
              href={entryInstructionsHref}
              className="inline-flex text-[15px] font-semibold text-white underline underline-offset-4"
            >
              View entry instructions
            </Link>
          ) : (
            <p className="text-sm text-white/45">
              Entry instructions appear when saved on the site scope.
            </p>
          )}
        </div>
      </div>

      <CommercialCtaButton href={routes.dashboardSupport}>
        <MessageCircle className="size-5" aria-hidden />
        Message crew
      </CommercialCtaButton>
      <p className="text-center text-xs text-[var(--ml-dark-ink-muted)]">
        Opens support — in-app crew chat ships when messaging is enabled. No fake chat
        threads.
      </p>
    </div>
  );
}
