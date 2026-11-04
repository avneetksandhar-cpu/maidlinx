import Link from "next/link";
import type { SavedAddress } from "@/lib/addresses/types";
import type { DashboardBooking } from "@/lib/dashboard/bookings";
import { buildPropertyHomeRows } from "@/lib/dashboard/property-home";
import { ContinueBookingBanner } from "@/components/booking/continue-booking-banner";
import { Button } from "@/components/ui";
import { routes } from "@/config/site";
import { cn } from "@/lib/utils";

interface CustomerPropertiesHomeProps {
  firstName?: string;
  properties: SavedAddress[];
  upcoming: DashboardBooking[];
}

/**
 * Customer Home / Properties — design-spec screen 1.
 * Real saved places + upcoming cleans only; never invents sample properties.
 */
export function CustomerPropertiesHome({
  properties,
  upcoming,
}: CustomerPropertiesHomeProps) {
  const rows = buildPropertyHomeRows(properties, upcoming);

  return (
    <div className="mx-auto w-full max-w-[430px] space-y-5 lg:max-w-none">
      <header className="space-y-1 pt-1">
        <h1 className="text-[1.85rem] font-semibold tracking-tight text-white">
          Your properties
        </h1>
        <p className="text-[15px] text-[var(--ml-dark-ink-muted)]">
          Schedule a clean for any saved place — or add one to get started.
        </p>
      </header>

      <ContinueBookingBanner />

      <Link href={routes.book} className="block">
        <Button
          variant="accent"
          className="booking-cta-btn h-14 w-full rounded-2xl text-base font-semibold shadow-[0_0_28px_rgb(8_224_212_/_0.28)]"
        >
          + Schedule a clean
        </Button>
      </Link>

      <section className="space-y-3" aria-label="Upcoming cleans by property">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-[15px] font-semibold text-white">Upcoming cleans</h2>
          {rows.length > 0 ? (
            <Link
              href={routes.dashboardSavedPlaces}
              className="text-sm font-medium text-[var(--ml-dark-mint)] underline-offset-4 hover:underline"
            >
              Manage
            </Link>
          ) : null}
        </div>

        {rows.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[var(--ml-dark-border)] bg-[var(--ml-dark-surface)] px-4 py-10 text-center">
            <p className="text-sm font-medium text-white">No properties yet</p>
            <p className="mt-1.5 text-sm text-[var(--ml-dark-ink-muted)]">
              Add a home, rental, or office — or schedule a clean and we’ll save the address.
            </p>
            <div className="mt-5 flex flex-col gap-2">
              <Link href={routes.dashboardSavedPlaces}>
                <Button
                  variant="secondary"
                  className="w-full rounded-2xl border-[var(--ml-dark-border-strong)] bg-transparent text-white hover:bg-[var(--ml-dark-surface-2)]"
                >
                  Add a property
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <ul className="space-y-2.5">
            {rows.map((row) => (
              <li key={row.key}>
                <PropertyCleanCard row={row} />
              </li>
            ))}
          </ul>
        )}
      </section>

      {upcoming.length > 0 ? (
        <p className="text-center text-xs text-[var(--ml-dark-ink-subtle)]">
          <Link
            href={routes.dashboardBookings}
            className="font-medium text-[var(--ml-dark-mint)] underline-offset-4 hover:underline"
          >
            View all bookings
          </Link>
        </p>
      ) : null}
    </div>
  );
}

function PropertyCleanCard({
  row,
}: {
  row: ReturnType<typeof buildPropertyHomeRows>[number];
}) {
  const href = row.nextClean
    ? routes.bookingDetail(row.nextClean.bookingId)
    : row.scheduleHref;

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-2xl border border-[var(--ml-dark-border)] bg-[var(--ml-dark-surface)] p-3.5 shadow-[var(--shadow-soft)]",
        "transition-colors hover:border-[var(--ml-dark-mint)]/40 active:scale-[0.99]",
      )}
    >
      <span
        className="flex size-14 shrink-0 items-center justify-center rounded-xl text-[var(--color-accent-foreground)]"
        style={{
          background:
            "linear-gradient(145deg, rgb(8 224 212 / 0.35) 0%, #08e0d4 70%, #003474 160%)",
        }}
        aria-hidden
      >
        <HomeMark />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-semibold text-white">{row.label}</p>
        {row.nextClean ? (
          <p className="mt-0.5 truncate text-sm text-[var(--ml-dark-ink-muted)]">
            Next clean · {row.nextClean.serviceLabel}
          </p>
        ) : (
          <p className="mt-0.5 truncate text-sm text-[var(--ml-dark-ink-muted)]">
            No upcoming cleans
          </p>
        )}
        <p className="mt-0.5 truncate text-xs text-[var(--ml-dark-ink-subtle)]">
          {row.addressLine}
        </p>
      </div>
      {row.nextClean ? (
        <span className="shrink-0 rounded-full bg-[var(--ml-dark-surface-2)] px-2.5 py-1 text-[11px] font-medium text-[var(--ml-dark-ink-muted)]">
          {row.nextClean.datePill}
        </span>
      ) : (
        <span className="shrink-0 text-xs font-medium text-[var(--ml-dark-mint)]">
          Schedule
        </span>
      )}
    </Link>
  );
}

function HomeMark() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
    </svg>
  );
}
