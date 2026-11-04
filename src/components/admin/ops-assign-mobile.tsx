"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Building2, Home } from "lucide-react";
import type { OpsQueueItem } from "@/lib/admin/queues";
import type { AdminCleaner } from "@/lib/admin/cleaners";
import type { AdminBooking } from "@/lib/admin/bookings";
import { formatAdminDate, getServiceLabel } from "@/lib/admin/display";
import { routes } from "@/config/site";
import { cn } from "@/lib/utils";

export type OpsAssignTab = "needs" | "assigned";

type OpsAssignMobileProps = {
  needsAssignment: OpsQueueItem[];
  assigned: AdminBooking[];
  cleaners: AdminCleaner[];
  initialTab?: OpsAssignTab;
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
}

function propertyLabel(item: OpsQueueItem): string {
  if (item.subtitle?.includes("·")) {
    const city = item.subtitle.split("·")[0]?.trim();
    if (city) return city;
  }
  return item.title || "Booking";
}

export function OpsAssignMobile({
  needsAssignment,
  assigned,
  cleaners,
  initialTab = "needs",
}: OpsAssignMobileProps) {
  const router = useRouter();
  const [tab, setTab] = useState<OpsAssignTab>(initialTab);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [assigning, setAssigning] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const availableCleaners = useMemo(
    () => cleaners.filter((c) => c.isActive).slice(0, 40),
    [cleaners],
  );

  async function assign(bookingId: string, professionalProfileId: string) {
    setAssigning(`${bookingId}:${professionalProfileId}`);
    setError(null);
    try {
      const res = await fetch(`/api/admin/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "assign", professionalProfileId }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error ?? "Unable to assign cleaner.");
      setExpandedId(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to assign cleaner.");
    } finally {
      setAssigning(null);
    }
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-5 lg:max-w-2xl lg:px-8">
      <h1 className="mb-4 text-2xl font-semibold tracking-tight text-[var(--ml-dark-ink)]">
        Operations
      </h1>

      <div
        className="mb-5 grid grid-cols-2 gap-1 rounded-full border border-[var(--ml-dark-border)] bg-[var(--ml-dark-surface)] p-1"
        role="tablist"
      >
        {(
          [
            { id: "needs" as const, label: "Needs assignment", count: needsAssignment.length },
            { id: "assigned" as const, label: "Assigned", count: assigned.length },
          ] as const
        ).map((item) => {
          const active = tab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setTab(item.id)}
              className={cn(
                "flex min-h-11 items-center justify-center gap-1.5 rounded-full px-2 text-sm font-semibold transition-colors",
                active
                  ? "bg-[var(--ml-dark-mint)] text-[var(--color-accent-foreground)]"
                  : "text-[var(--ml-dark-ink-muted)]",
              )}
            >
              <span className="truncate">{item.label}</span>
              {item.count > 0 ? (
                <span className="tabular-nums text-xs opacity-80">{item.count}</span>
              ) : null}
            </button>
          );
        })}
      </div>

      {error ? <p className="mb-3 text-sm text-error">{error}</p> : null}

      {tab === "needs" ? (
        needsAssignment.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-[var(--ml-dark-border)] bg-[var(--ml-dark-surface)] px-4 py-10 text-center text-sm text-[var(--ml-dark-ink-muted)]">
            No jobs need assignment right now.
          </p>
        ) : (
          <div className="space-y-3">
            {needsAssignment.map((item) => {
              const bookingId = item.bookingId;
              if (!bookingId) return null;
              const open = expandedId === bookingId;
              return (
                <article
                  key={item.id}
                  className="overflow-hidden rounded-2xl border border-[var(--ml-dark-border)] bg-[var(--ml-dark-surface)] p-4"
                >
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-[var(--ml-dark-ink)]">
                      {item.scheduledAt ? formatAdminDate(item.scheduledAt) : "Schedule TBD"}
                    </p>
                    <div className="flex items-center gap-3">
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[var(--ml-dark-surface-2)] text-[var(--ml-dark-ink-muted)]">
                        <Home className="size-5" strokeWidth={1.75} aria-hidden />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-[var(--ml-dark-ink)]">
                          {propertyLabel(item)}
                        </p>
                        <p className="truncate text-sm text-[var(--ml-dark-ink-muted)]">
                          {[item.title, item.marketLabel].filter(Boolean).join(" · ")}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setExpandedId(open ? null : bookingId)}
                      className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-[var(--ml-dark-mint)] text-sm font-semibold text-[var(--color-accent-foreground)] active:opacity-90"
                    >
                      {open ? "Hide cleaners" : "Assign cleaner"}
                    </button>

                    {open ? (
                      <div className="space-y-2 border-t border-[var(--ml-dark-border)] pt-3">
                        <p className="text-sm font-semibold text-[var(--ml-dark-ink)]">
                          Available cleaners
                        </p>
                        {availableCleaners.length === 0 ? (
                          <p className="text-sm text-[var(--ml-dark-ink-muted)]">
                            No active cleaners in the directory yet.
                          </p>
                        ) : (
                          <ul className="space-y-2">
                            {availableCleaners.map((cleaner) => {
                              const name =
                                [cleaner.firstName, cleaner.lastName].filter(Boolean).join(" ") ||
                                "Unnamed";
                              const busy = assigning === `${bookingId}:${cleaner.profileId}`;
                              return (
                                <li
                                  key={cleaner.profileId}
                                  className="flex items-center gap-3 rounded-xl bg-[var(--ml-dark-surface-2)] px-3 py-2.5"
                                >
                                  <span className="relative flex size-10 shrink-0 items-center justify-center rounded-full bg-[var(--ml-dark-border)] text-xs font-bold text-[var(--ml-dark-ink)]">
                                    {initials(name)}
                                    {cleaner.isOnline ? (
                                      <span
                                        className="absolute bottom-0 right-0 size-2.5 rounded-full border-2 border-[var(--ml-dark-surface-2)] bg-emerald-400"
                                        aria-label="Online"
                                      />
                                    ) : null}
                                  </span>
                                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-[var(--ml-dark-ink)]">
                                    {name}
                                  </span>
                                  <button
                                    type="button"
                                    disabled={assigning !== null}
                                    onClick={() => void assign(bookingId, cleaner.profileId)}
                                    className="shrink-0 rounded-full border border-[var(--ml-dark-border-strong)] px-3 py-2 text-xs font-semibold text-[var(--ml-dark-ink)] active:bg-[var(--ml-dark-surface)] disabled:opacity-60"
                                  >
                                    {busy ? "…" : "Assign cleaner"}
                                  </button>
                                </li>
                              );
                            })}
                          </ul>
                        )}
                        <Link
                          href={`${routes.adminBookings}?booking=${bookingId}`}
                          className="inline-flex text-sm font-medium text-[var(--ml-dark-mint)]"
                        >
                          Open full booking
                        </Link>
                      </div>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        )
      ) : assigned.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-[var(--ml-dark-border)] bg-[var(--ml-dark-surface)] px-4 py-10 text-center text-sm text-[var(--ml-dark-ink-muted)]">
          No assigned jobs in the active window.
        </p>
      ) : (
        <div className="space-y-3">
          {assigned.map((booking) => (
            <Link
              key={booking.id}
              href={`${routes.adminBookings}?booking=${booking.id}`}
              className="block rounded-2xl border border-[var(--ml-dark-border)] bg-[var(--ml-dark-surface)] p-4 active:bg-[var(--ml-dark-surface-2)]"
            >
              <p className="text-sm font-medium text-[var(--ml-dark-ink)]">
                {formatAdminDate(booking.scheduledAt)}
              </p>
              <div className="mt-3 flex items-center gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[var(--ml-dark-surface-2)] text-[var(--ml-dark-ink-muted)]">
                  <Building2 className="size-5" strokeWidth={1.75} aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-[var(--ml-dark-ink)]">
                    {booking.addressCity || booking.customerName || "Booking"}
                  </p>
                  <p className="truncate text-sm text-[var(--ml-dark-ink-muted)]">
                    {[getServiceLabel(booking.serviceType), booking.professionalName]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
