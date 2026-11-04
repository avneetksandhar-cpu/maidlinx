"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { HomeUsualCleanCard } from "@/components/home/home-usual-clean-card";
import type { HomeResumeCta } from "@/lib/home/resume-cta";
import type { DashboardBooking } from "@/lib/dashboard/bookings";
import { getCustomerFriendlyStatusLabel } from "@/lib/bookings/status-timeline";
import { trackBookingEvent } from "@/lib/analytics/booking";

function formatUpcomingWhen(booking: DashboardBooking): {
  dateLabel: string;
  windowLabel: string;
} {
  const start = booking.arrivalWindowStart
    ? new Date(booking.arrivalWindowStart)
    : new Date(booking.scheduledAt);
  const end = booking.arrivalWindowEnd ? new Date(booking.arrivalWindowEnd) : null;
  const dateLabel = start.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const fmt = (d: Date) =>
    d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  const windowLabel = end ? `${fmt(start)} – ${fmt(end)}` : fmt(start);
  return { dateLabel, windowLabel };
}

interface HomeResumeCardProps {
  resume: HomeResumeCta;
  upcoming: DashboardBooking | null;
  className?: string;
}

/**
 * One primary Home tap — on the way / upcoming / finish booking / usual.
 * Real data only; never invents bookings or ETAs.
 */
export function HomeResumeCard({ resume, upcoming, className }: HomeResumeCardProps) {
  const router = useRouter();

  if (resume.kind === "usual") {
    return (
      <HomeUsualCleanCard
        className={className}
        ctaLabel={resume.cta}
        onBeforeNavigate={() => {
          trackBookingEvent("booking_started", { entry: "home_resume_usual" });
        }}
      />
    );
  }

  if (resume.kind === "finish_booking") {
    return (
      <section
        className={`rounded-2xl border border-white/15 bg-[#102B49] p-4 text-left ${className ?? ""}`}
      >
        <p className="text-[11px] font-semibold tracking-[0.14em] text-[#04CED2] uppercase">
          {resume.label}
        </p>
        <p className="mt-1 text-[15px] text-white/75">
          We saved your selections on this device — never payment details.
        </p>
        <button
          type="button"
          className="mt-3 inline-flex h-12 w-full items-center justify-center rounded-xl bg-[#04CED2] text-[15px] font-semibold text-[#01193D] transition-opacity hover:opacity-95"
          onClick={() => {
            trackBookingEvent("booking_started", { entry: "home_resume_finish" });
            router.push(resume.href);
          }}
        >
          {resume.cta}
        </button>
      </section>
    );
  }

  const when = upcoming ? formatUpcomingWhen(upcoming) : null;

  return (
    <Link
      href={resume.href}
      onClick={() =>
        trackBookingEvent("booking_started", {
          entry:
            resume.kind === "on_the_way"
              ? "home_resume_arrival"
              : "home_resume_upcoming",
        })
      }
      className={`flex items-center justify-between gap-3 rounded-2xl border border-white/15 bg-[#102B49] px-3.5 py-3 text-left ${className ?? ""}`}
    >
      <div className="min-w-0">
        <p className="text-[11px] font-semibold tracking-[0.14em] text-[#04CED2] uppercase">
          {resume.label}
        </p>
        {when ? (
          <>
            <p className="mt-0.5 truncate text-[16px] font-semibold text-white">
              {when.dateLabel}
            </p>
            <p className="truncate text-[15px] text-white/70">{when.windowLabel}</p>
          </>
        ) : null}
        {upcoming ? (
          <p className="mt-1 text-xs font-medium text-[#04CED2]">
            {getCustomerFriendlyStatusLabel(upcoming.status)}
          </p>
        ) : null}
      </div>
      <span className="inline-flex shrink-0 items-center gap-0.5 text-sm font-semibold text-[#04CED2]">
        {resume.cta}
        <ChevronRight className="size-4" aria-hidden />
      </span>
    </Link>
  );
}
