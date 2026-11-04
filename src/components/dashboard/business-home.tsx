import Link from "next/link";
import type { DashboardBooking } from "@/lib/dashboard/bookings";
import type { SavedAddress } from "@/lib/addresses/types";
import { Button } from "@/components/ui";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { routes } from "@/config/site";
import { formatCurrency } from "@/lib/utils";

interface BusinessHomeProps {
  firstName: string;
  properties: SavedAddress[];
  upcoming: DashboardBooking[];
  completedCount: number;
  monthlySpendCents: number;
  currency: string;
}

/**
 * Multi-property B2B overview — dark cards + mint Book a Cleaning CTA (design-spec).
 * All figures come from real dashboard queries; zeros when empty.
 */
export function BusinessHome({
  firstName,
  properties,
  upcoming,
  completedCount,
  monthlySpendCents,
  currency,
}: BusinessHomeProps) {
  const name = firstName.trim() || "there";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            {greeting}, {name}.
          </h1>
          <p className="text-sm text-[var(--ml-dark-ink-muted)]">
            Manage cleans across your properties — book, track, and invoice in one place.
          </p>
        </header>
        <Link href={routes.book}>
          <Button
            variant="primary"
            size="lg"
            className="booking-cta-btn rounded-2xl shadow-[0_0_24px_rgb(8_224_212_/_0.28)]"
          >
            + Book a Cleaning
          </Button>
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Properties" value={String(properties.length)} />
        <StatCard label="Upcoming Cleans" value={String(upcoming.length)} />
        <StatCard label="Completed Jobs" value={String(completedCount)} />
        <StatCard label="Monthly Spend" value={formatCurrency(monthlySpendCents, currency)} />
      </div>

      <section className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Upcoming Bookings</h2>
            <Link
              href={routes.dashboardBookings}
              className="text-sm font-medium text-[var(--ml-dark-mint)] underline-offset-4 hover:underline"
            >
              View all
            </Link>
          </div>
          {upcoming.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-[var(--ml-dark-border)] bg-[var(--ml-dark-surface)] px-4 py-8 text-center text-sm text-[var(--ml-dark-ink-muted)]">
              No upcoming cleans yet.{" "}
              <Link
                href={routes.book}
                className="font-medium text-[var(--ml-dark-mint)] underline-offset-4 hover:underline"
              >
                Book one
              </Link>
            </p>
          ) : (
            <ul className="space-y-2">
              {upcoming.slice(0, 5).map((b) => (
                <li key={b.id}>
                  <Link
                    href={routes.bookingDetail(b.id)}
                    className="flex items-start justify-between gap-3 rounded-2xl border border-[var(--ml-dark-border)] bg-[var(--ml-dark-surface)] px-4 py-3.5 shadow-[var(--shadow-soft)] transition-colors hover:border-[var(--ml-dark-mint)]/40"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-white">
                        {b.addressLine1 || "Property"}
                        {b.addressCity ? `, ${b.addressCity}` : ""}
                      </p>
                      <p className="mt-0.5 text-xs text-[var(--ml-dark-ink-muted)]">
                        {formatWhen(b.scheduledAt)} · {b.serviceType}
                      </p>
                    </div>
                    <StatusBadge status={b.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Your Properties</h2>
            <Link
              href={routes.dashboardSavedPlaces}
              className="text-sm font-medium text-[var(--ml-dark-mint)] underline-offset-4 hover:underline"
            >
              Manage
            </Link>
          </div>
          {properties.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-[var(--ml-dark-border)] bg-[var(--ml-dark-surface)] px-4 py-8 text-center text-sm text-[var(--ml-dark-ink-muted)]">
              Save addresses as you book to build your property list.
            </p>
          ) : (
            <ul className="space-y-2">
              {properties.slice(0, 6).map((p) => (
                <li
                  key={p.id}
                  className="flex items-center gap-3 rounded-2xl border border-[var(--ml-dark-border)] bg-[var(--ml-dark-surface)] px-4 py-3.5 shadow-[var(--shadow-soft)]"
                >
                  <span
                    className="flex size-11 shrink-0 items-center justify-center rounded-xl text-[var(--color-accent-foreground)]"
                    style={{
                      background:
                        "linear-gradient(145deg, rgb(8 224 212 / 0.35) 0%, #08e0d4 70%, #003474 160%)",
                    }}
                    aria-hidden
                  >
                    <HomeMark />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">{p.label}</p>
                    <p className="truncate text-xs text-[var(--ml-dark-ink-muted)]">
                      {p.addressLine1}
                      {p.city ? `, ${p.city}` : ""}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[var(--ml-dark-border)] bg-[var(--ml-dark-surface)] px-4 py-4 shadow-[var(--shadow-soft)]">
      <p className="text-xs font-medium tracking-wide text-[var(--ml-dark-ink-muted)] uppercase">
        {label}
      </p>
      <p className="mt-1.5 text-2xl font-semibold tabular-nums text-white">{value}</p>
    </div>
  );
}

function formatWhen(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function HomeMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
    </svg>
  );
}
