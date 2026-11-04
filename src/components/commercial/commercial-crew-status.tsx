"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Building2, Calendar, MapPin, MessageCircle } from "lucide-react";
import { BrandLockup } from "@/components/brand/brand-lockup";
import { LiveCleanerMap } from "@/components/booking/live-cleaner-map";
import { CommercialCtaButton } from "@/components/commercial/commercial-book-chrome";
import { CommercialEntryInstructions } from "@/components/commercial/commercial-entry-instructions";
import { getCommercialConfirmationView } from "@/lib/commercial/confirmation";
import {
  ENTRY_METHOD_LABELS,
  type VisitEntryInstructions,
} from "@/lib/commercial/entry-instructions";
import { isLiveLocationStatus } from "@/lib/bookings/status";
import type { DashboardBooking } from "@/lib/dashboard/bookings";
import { formatBookingDate, formatBookingTimeRange } from "@/lib/dashboard/display";
import { formatCurrency } from "@/lib/utils";
import { routes } from "@/config/site";

interface CommercialCrewStatusProps {
  job: DashboardBooking;
  siteLabel?: string | null;
  initialEntry?: VisitEntryInstructions | null;
  /** Live map only when cleaner is on_the_way/arrived AND consented location may exist. */
  showLiveMapEligible: boolean;
  accessToken?: string | null;
  customerLat?: number | null;
  customerLng?: number | null;
}

/**
 * Commercial post-confirm booking detail — confirmation phase, practical details,
 * entry instructions, and truthful crew status (no fake map/ETA).
 */
export function CommercialCrewStatus({
  job,
  siteLabel,
  initialEntry = null,
  showLiveMapEligible,
  accessToken,
  customerLat,
  customerLng,
}: CommercialCrewStatusProps) {
  const router = useRouter();
  const [entry, setEntry] = useState<VisitEntryInstructions | null>(initialEntry);

  const view = getCommercialConfirmationView({
    status: job.status,
    paymentStatus: job.paymentStatus,
    professionalProfileId: job.professionalProfileId,
    cleanerId: job.cleanerId,
    serviceOrderId: job.serviceOrderId,
    isCommercial: job.isCommercial || Boolean(job.serviceOrderId),
    totalCents: job.totalCents,
    currency: job.currency,
    frequency: job.frequency,
    billingCadence: job.billingCadence,
    dueNowCents: job.dueNowCents,
    nextVisitAt: job.nextVisitAt,
    scheduledAt: job.scheduledAt,
    arrivalWindowStart: job.arrivalWindowStart,
    arrivalWindowEnd: job.arrivalWindowEnd,
  });

  // Auto-refresh while confirming — never re-creates booking/charge (idempotent server).
  useEffect(() => {
    if (view.phase !== "confirming") return;
    const id = window.setInterval(() => {
      router.refresh();
    }, 2500);
    return () => window.clearInterval(id);
  }, [view.phase, router]);

  const teamName = job.professionalName?.trim() || "Cleaning team";
  const suite = job.addressLine2?.trim() || null;
  const property =
    siteLabel?.trim() ||
    [job.addressLine1, job.addressCity].filter(Boolean).join(", ") ||
    "Property";
  const live =
    view.showLiveMapEligible &&
    showLiveMapEligible &&
    isLiveLocationStatus(job.status);
  const addressLabel = [job.addressLine1, job.addressCity, job.addressState]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="mx-auto w-full max-w-[390px] space-y-4 lg:max-w-[430px]">
      <header className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <BrandLockup href={routes.dashboard} size="compact" tone="onDark" />
          <Link
            href={routes.dashboardJobs}
            className="text-sm font-semibold text-[#04CED2]"
          >
            Bookings
          </Link>
        </div>
        <div className="space-y-1.5">
          <h1 className="text-[1.75rem] leading-tight font-bold tracking-tight text-white">
            {view.headline}
          </h1>
          <p className="text-sm text-white/65">{view.subcopy}</p>
          {view.phase === "confirming" ? (
            <p className="text-xs text-[#04CED2]" role="status">
              Refreshing status… Stripe LIVE is OFF · no second charge on refresh.
            </p>
          ) : null}
        </div>
      </header>

      {/* Practical details */}
      <section className="rounded-2xl border border-white/10 bg-[var(--ml-dark-surface,#102B49)] px-4 py-4">
        <p className="text-[11px] font-semibold tracking-wide text-white/55 uppercase">
          Visit details
        </p>
        <dl className="mt-3 space-y-3 text-[14px]">
          <DetailRow label="Property">
            {property}
            {suite ? (
              <>
                <br />
                <span className="text-white/70">Suite / unit · {suite}</span>
              </>
            ) : null}
          </DetailRow>
          <DetailRow label="Cleaning team">{teamName}</DetailRow>
          <DetailRow label="Service date">
            {formatBookingDate(job.scheduledAt)}
          </DetailRow>
          <DetailRow label="Arrival window">
            {formatBookingTimeRange(
              job.scheduledAt,
              job.arrivalWindowStart,
              job.arrivalWindowEnd,
            )}
            <span className="mt-0.5 block text-xs font-normal text-white/45">
              Property local time
            </span>
          </DetailRow>
          <DetailRow label="Price / visit">{view.pricePerVisitLabel}</DetailRow>
          <DetailRow label="Paid today">
            {formatCurrency(view.amountPaidTodayCents, job.currency)}
            {view.amountPaidTodayCents === 0 ? (
              <span className="mt-0.5 block text-xs font-normal text-white/45">
                Stripe LIVE OFF · billed per terms (TEST)
              </span>
            ) : null}
          </DetailRow>
          {view.futureRecurringLabel ? (
            <DetailRow label="Future recurring">
              {view.futureRecurringLabel}
            </DetailRow>
          ) : null}
          {view.nextVisitAt ? (
            <DetailRow label="Next visit">
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="size-3.5 text-[#04CED2]" aria-hidden />
                {formatBookingDate(view.nextVisitAt)}
              </span>
            </DetailRow>
          ) : null}
        </dl>
      </section>

      {/* Crew status — Scheduled until real on_the_way */}
      {view.phase === "confirmed" ? (
        <section className="rounded-2xl border border-white/10 bg-[var(--ml-dark-surface,#102B49)] px-4 py-4 shadow-[var(--shadow-soft)]">
          <p className="text-[1.25rem] font-bold tracking-tight text-white">
            {view.showCrewOnTheWay ? "Crew on the way" : "Scheduled"}
          </p>
          <p className="mt-1 text-sm text-white/65">{view.crewHeadline}</p>

          {live ? (
            <div className="mt-4 overflow-hidden rounded-2xl border border-white/10">
              <LiveCleanerMap
                bookingId={job.id}
                accessToken={accessToken}
                status={job.status}
                customerLat={customerLat}
                customerLng={customerLng}
                addressLabel={addressLabel || property}
                showHeader={false}
                className="aspect-[16/11] min-h-[180px]"
              />
            </div>
          ) : (
            <div className="mt-4 rounded-2xl border border-dashed border-white/15 bg-[#01193D]/40 px-4 py-5 text-center">
              <MapPin className="mx-auto size-6 text-[#04CED2]" aria-hidden />
              <p className="mt-2 text-sm font-semibold text-white">
                {view.showCrewOnTheWay
                  ? "Waiting for live location"
                  : "Live map unavailable"}
              </p>
              <p className="mt-1 text-sm text-white/50">
                {view.showCrewOnTheWay
                  ? "ETA appears only when your assigned crew shares a consented live location. We never show a simulated route."
                  : "Map and ETA appear only while the crew is on the way or arrived and sharing location."}
              </p>
            </div>
          )}

          <div className="mt-4 space-y-3">
            <div className="flex items-center gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#04CED2]/15 text-[#04CED2]">
                <Building2 className="size-4" aria-hidden />
              </span>
              <div className="min-w-0">
                <p className="truncate text-[15px] font-semibold text-white">
                  {teamName}
                </p>
                <p className="text-xs text-white/55">
                  Status · {job.status.replaceAll("_", " ")}
                </p>
              </div>
            </div>
            {entry ? (
              <p className="text-sm text-white/70">
                Entry · {ENTRY_METHOD_LABELS[entry.method]}
                {entry.note.trim() ? ` — ${entry.note.trim()}` : ""}
              </p>
            ) : null}
          </div>
        </section>
      ) : null}

      <CommercialEntryInstructions
        bookingId={job.id}
        initialEntry={entry}
        enabled={view.phase === "confirmed"}
        onSaved={setEntry}
      />

      {view.phase === "confirmed" && !entry ? (
        <p className="text-center text-xs text-white/45">
          Main action until saved: add entry instructions so the crew can get in.
        </p>
      ) : null}

      <CommercialCtaButton href={routes.dashboardSupport}>
        <MessageCircle className="size-5" aria-hidden />
        Message crew
      </CommercialCtaButton>
      <p className="pb-6 text-center text-xs text-[var(--ml-dark-ink-muted)]">
        Opens support — in-app crew chat ships when messaging is enabled.
      </p>
    </div>
  );
}

function DetailRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-white/50">{label}</dt>
      <dd className="max-w-[62%] text-right font-medium text-white">{children}</dd>
    </div>
  );
}
