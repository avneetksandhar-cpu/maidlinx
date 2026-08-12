"use client";

import { useMemo, useState } from "react";
import { OwnerStat } from "@/components/owner/owner-stat";
import { LAUNCH_MARKET_IDS } from "@/config/markets";
import type {
  CleanerCoverageRow,
  LaunchCoverageStatus,
  MarketLaunchCoverage,
} from "@/lib/owner/launch-coverage";
import { cn } from "@/lib/utils";

function statusClass(status: LaunchCoverageStatus): string {
  if (status === "GREEN") return "bg-emerald-600 text-white";
  if (status === "YELLOW") return "bg-amber-500 text-ink";
  return "bg-rose-600 text-white";
}

type TabId = "ALL" | (typeof LAUNCH_MARKET_IDS)[number];

const TABS: Array<{ id: TabId; label: string }> = [
  { id: "ALL", label: "ALL" },
  { id: "TORONTO_GTA", label: "TORONTO_GTA" },
  { id: "SOUTH_FLORIDA", label: "SOUTH_FLORIDA" },
];

export function MarketCoverageTabs({
  markets,
  cleaners,
}: {
  markets: MarketLaunchCoverage[];
  cleaners: CleanerCoverageRow[];
}) {
  const [tab, setTab] = useState<TabId>("ALL");

  const launchMarkets = useMemo(
    () =>
      markets.filter((m) =>
        (LAUNCH_MARKET_IDS as readonly string[]).includes(m.marketId),
      ),
    [markets],
  );

  const visibleMarkets = useMemo(() => {
    if (tab === "ALL") return launchMarkets;
    return launchMarkets.filter((m) => m.marketId === tab);
  }, [launchMarkets, tab]);

  const visibleCleaners = useMemo(() => {
    if (tab === "ALL") return cleaners;
    return cleaners.filter(
      (c) => c.marketId === tab || c.markets.includes(tab),
    );
  }, [cleaners, tab]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => {
          const market = launchMarkets.find((m) => m.marketId === t.id);
          const status = t.id === "ALL" ? null : market?.status;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                "inline-flex min-h-10 items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                tab === t.id
                  ? "border-navy bg-navy text-white"
                  : "border-border bg-surface text-ink hover:bg-surface-muted",
              )}
            >
              {t.label}
              {status ? (
                <span
                  className={cn(
                    "rounded px-1.5 py-0.5 text-[10px] font-semibold",
                    statusClass(status),
                  )}
                >
                  {status === "GREEN" ? "🟢" : status === "YELLOW" ? "🟡" : "🔴"} {status}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      <p className="text-sm text-ink-muted">
        Per-market readiness is independent — do not combine TORONTO_GTA + SOUTH_FLORIDA for launch.
      </p>

      {visibleMarkets.map((m) => (
        <section
          key={m.marketId}
          className="rounded-xl border border-border bg-surface p-4 shadow-card"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-display text-lg font-semibold text-ink">{m.marketName}</h3>
              <p className="text-xs text-ink-muted">
                {m.marketId} · {m.currency ?? "—"} · booking_enabled=
                {m.bookingEnabled ? "true" : "false"} · launch_enabled=
                {m.launchEnabled ? "true" : "false"}
              </p>
            </div>
            <span
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-semibold uppercase tracking-wide",
                statusClass(m.status),
              )}
            >
              {m.status === "GREEN" ? "🟢" : m.status === "YELLOW" ? "🟡" : "🔴"} {m.status}
            </span>
          </div>

          <dl className="mt-4 grid gap-3 grid-cols-2 lg:grid-cols-4">
            <OwnerStat label="Approved" value={m.approvedCleaners} />
            <OwnerStat label="Bookable" value={m.bookableCleaners} />
            <OwnerStat label="Available today" value={m.availableToday} />
            <OwnerStat
              label="Services"
              value={`${m.servicesCovered}/${m.catalogServices}`}
            />
            <OwnerStat
              label="Zones covered"
              value={`${m.zonesWithCleaners}/${m.zonesConfigured || "—"}`}
            />
            <OwnerStat label="Online capacity" value={m.availableCapacity} />
            <OwnerStat
              label="Coverage ready"
              value={m.coverageReady ? "YES" : "NO"}
            />
            <OwnerStat label="Launch ready" value={m.launchReady ? "YES" : "NO"} />
          </dl>

          <dl className="mt-3 grid gap-3 grid-cols-2 lg:grid-cols-4 text-sm">
            <div>
              <dt className="text-ink-muted">Pricing ready</dt>
              <dd className="font-medium text-ink">{m.pricingReady ? "YES" : "NO"}</dd>
            </div>
            <div>
              <dt className="text-ink-muted">Currency ready</dt>
              <dd className="font-medium text-ink">
                {m.currencyReady ? `YES (${m.currency})` : "NO"}
              </dd>
            </div>
          </dl>

          {m.majorGaps.length > 0 ? (
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-ink-muted">
              {m.majorGaps.map((g) => (
                <li key={`${m.marketId}-${g}`}>{g}</li>
              ))}
            </ul>
          ) : null}
        </section>
      ))}

      <section>
        <h3 className="font-display text-lg font-semibold text-ink">
          Cleaners {tab === "ALL" ? "" : `· ${tab}`}
        </h3>
        {visibleCleaners.length === 0 ? (
          <p className="mt-3 text-sm text-ink-muted">
            {tab === "ALL"
              ? "No cleaner rows."
              : "No cleaners attributed to this market (market_id or zones)."}
          </p>
        ) : (
          <div className="mt-3 overflow-x-auto rounded-xl border border-border bg-surface">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-border text-xs text-ink-muted">
                <tr>
                  <th className="px-3 py-2 font-medium">Cleaner</th>
                  <th className="px-3 py-2 font-medium">Approval</th>
                  <th className="px-3 py-2 font-medium">Onboarding</th>
                  <th className="px-3 py-2 font-medium">Market</th>
                  <th className="px-3 py-2 font-medium">Zones</th>
                  <th className="px-3 py-2 font-medium">Services</th>
                  <th className="px-3 py-2 font-medium">Avail</th>
                  <th className="px-3 py-2 font-medium">Eligible</th>
                  <th className="px-3 py-2 font-medium">Upcoming</th>
                  <th className="px-3 py-2 font-medium">Missing</th>
                </tr>
              </thead>
              <tbody>
                {visibleCleaners.map((c) => (
                  <tr
                    key={c.cleanerId}
                    className="border-b border-border/60 last:border-0 align-top"
                  >
                    <td className="px-3 py-2 font-mono text-xs text-ink">
                      {c.cleanerId.slice(0, 8)}…
                    </td>
                    <td className="px-3 py-2">
                      {c.approved && c.active
                        ? "approved+active"
                        : c.approved
                          ? "approved"
                          : "no"}
                    </td>
                    <td className="px-3 py-2">{c.onboardingStatus}</td>
                    <td className="px-3 py-2">
                      {c.marketId ?? (c.markets[0] ? `${c.markets[0]} (zones)` : "—")}
                    </td>
                    <td className="px-3 py-2">{c.zoneCount}</td>
                    <td className="px-3 py-2">{c.serviceCount}</td>
                    <td className="px-3 py-2">{c.availabilityCount}</td>
                    <td className="px-3 py-2">
                      {c.bookable
                        ? "bookable"
                        : c.eligibleToReceiveJobs
                          ? "online only"
                          : "no"}
                    </td>
                    <td className="px-3 py-2">{c.upcomingAssignments}</td>
                    <td className="px-3 py-2 text-xs text-ink-muted">
                      {c.missing.length ? c.missing.join(", ") : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
