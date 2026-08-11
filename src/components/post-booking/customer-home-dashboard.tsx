import Link from "next/link";
import type { DashboardBooking } from "@/lib/dashboard/bookings";
import { LiveStatusCard } from "@/components/post-booking/live-status-card";
import { UpcomingBookingCard } from "@/components/post-booking/upcoming-booking-card";
import { ContinueBookingBanner } from "@/components/booking/continue-booking-banner";
import { Button } from "@/components/ui";
import { routes } from "@/config/site";
import { ACTIVE_JOB_STATUSES, isPaidBookingStatus } from "@/lib/bookings/status";
import type { StoredBooking } from "@/lib/bookings/repository";

interface CustomerHomeDashboardProps {
  firstName: string;
  activeBooking: StoredBooking | null;
  upcoming: DashboardBooking[];
}

/**
 * Customer home (/dashboard, /account): featured active booking or empty CTA.
 */
export function CustomerHomeDashboard({
  firstName,
  activeBooking,
  upcoming,
}: CustomerHomeDashboardProps) {
  const name = firstName.trim() || "there";
  const nextUpcoming = upcoming[0] ?? null;

  if (!activeBooking && upcoming.length === 0) {
    return (
      <div className="mx-auto max-w-[430px] space-y-6 lg:max-w-none">
        <header className="space-y-1">
          <p className="text-base text-[var(--maidlinx-text)]">Hi, {name}</p>
          <h1 className="font-display text-[1.75rem] font-bold tracking-tight text-[var(--maidlinx-ink)]">
            Ready for a fresh space?
          </h1>
          <p className="text-[15px] text-[var(--maidlinx-muted)]">
            Book a clean in minutes — we’ll confirm and assign your MaidLinx Pro.
          </p>
        </header>

        <ContinueBookingBanner />

        <div className="flex items-center gap-3 overflow-hidden rounded-2xl bg-[var(--maidlinx-mint)] p-4">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white text-[var(--maidlinx-green)]">
            <SparkIcon />
          </span>
          <p className="text-sm leading-snug text-[var(--maidlinx-text)]">
            Your home, your time. We handle the cleaning so you can focus on what matters.
          </p>
        </div>

        <Link href={routes.book}>
          <Button variant="accent" className="h-12 w-full text-base">
            Book a clean
          </Button>
        </Link>
      </div>
    );
  }

  if (activeBooking) {
    return (
      <div className="space-y-6 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(280px,360px)] lg:items-start lg:gap-8 lg:space-y-0">
        <div className="space-y-6">
          <header className="space-y-1">
            <p className="text-base text-[var(--maidlinx-text)]">Hi, {name}</p>
            <h1 className="font-display text-[1.65rem] font-bold tracking-tight text-[var(--maidlinx-ink)]">
              You’ve got a cleaning coming up.
            </h1>
            <p className="text-[15px] text-[var(--maidlinx-muted)]">
              Sit back, we’ve got it from here.
            </p>
          </header>
          <LiveStatusCard booking={activeBooking} />
        </div>
        <div className="space-y-6">
          {nextUpcoming ? (
            <UpcomingBookingCard booking={nextUpcoming} showViewAll />
          ) : (
            <UpcomingBookingCard booking={activeBooking} showViewAll />
          )}
          <Link href={routes.book}>
            <Button variant="secondary" className="w-full">
              Book another clean
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <p className="text-base text-[var(--maidlinx-text)]">Hi, {name}</p>
        <h1 className="font-display text-[1.65rem] font-bold tracking-tight text-[var(--maidlinx-ink)]">
          Your upcoming cleans
        </h1>
        <p className="text-[15px] text-[var(--maidlinx-muted)]">
          Sit back, we’ve got it from here.
        </p>
      </header>
      {nextUpcoming ? <UpcomingBookingCard booking={nextUpcoming} showViewAll /> : null}
      <Link href={routes.book}>
        <Button variant="accent" className="w-full">
          Book a clean
        </Button>
      </Link>
    </div>
  );
}

/** Prefer in-progress / en-route bookings for the featured live card. */
export function pickActiveCustomerBooking(
  bookings: StoredBooking[],
): StoredBooking | null {
  const live = bookings.find((b) =>
    (ACTIVE_JOB_STATUSES as readonly string[]).includes(b.status),
  );
  if (live) return live;
  const paid = bookings.find((b) => isPaidBookingStatus(b.status) && b.status !== "completed");
  return paid ?? null;
}

function SparkIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 3v3M12 18v3M3 12h3M18 12h3M6.2 6.2l2.1 2.1M15.7 15.7l2.1 2.1M17.8 6.2l-2.1 2.1M8.3 15.7l-2.1 2.1"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}
