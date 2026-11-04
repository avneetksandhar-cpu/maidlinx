"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { SiteKindIcon } from "@/components/business/site-kind-icon";
import { Button, Input } from "@/components/ui";
import type { SavedAddress } from "@/lib/addresses/types";
import {
  emptySiteScope,
  readSiteScope,
  writeSiteScope,
  type SiteScope,
  type SiteScopeFrequency,
} from "@/lib/business/site-scope";
import {
  COMMERCIAL_AREAS,
  SERVICE_DAYS,
  areaLabel,
  dayLabel,
  frequencyLabel,
  type CommercialArea,
  type ServiceDay,
} from "@/lib/commercial/types";
import { routes } from "@/config/site";
import { cn } from "@/lib/utils";

const FREQUENCIES: SiteScopeFrequency[] = [
  "one_time",
  "weekly",
  "biweekly",
  "monthly",
];

interface DefineScopeFormProps {
  site: SavedAddress;
  initialServerScope?: {
    areas: string[];
    frequency: string;
    serviceDays: string[];
    serviceWindow: string | null;
    startDate: string | null;
    squareFootage: number | null;
    siteContact: string | null;
    accessNotes: string | null;
    summaryPlain: string;
  } | null;
}

/**
 * Board 01 — Define Scope + Choose Service (areas, sq ft, one-time/recurring, days, window).
 * Persists to server + local mirror so Back/refresh/sign-in keep the plain-language summary.
 */
export function DefineScopeForm({ site, initialServerScope }: DefineScopeFormProps) {
  const router = useRouter();
  const [scope, setScope] = useState<SiteScope>(() => emptySiteScope(site.id));
  const [areas, setAreas] = useState<CommercialArea[]>([
    "restrooms",
    "floors",
    "common_areas",
  ]);
  const [serviceDays, setServiceDays] = useState<ServiceDay[]>(["mon", "wed", "fri"]);
  const [hydrated, setHydrated] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    const local = readSiteScope(site.id);
    if (initialServerScope) {
      setAreas(
        (initialServerScope.areas.filter((a) =>
          (COMMERCIAL_AREAS as readonly string[]).includes(a),
        ) as CommercialArea[]) || ["restrooms", "floors", "common_areas"],
      );
      setServiceDays(
        (initialServerScope.serviceDays.filter((d) =>
          (SERVICE_DAYS as readonly string[]).includes(d),
        ) as ServiceDay[]) || ["mon", "wed", "fri"],
      );
      setScope({
        ...emptySiteScope(site.id),
        squareFootage: initialServerScope.squareFootage
          ? String(initialServerScope.squareFootage)
          : "",
        areas: initialServerScope.areas.map(areaLabel).join(", "),
        scheduleWindow: initialServerScope.serviceWindow ?? "",
        frequency: (initialServerScope.frequency as SiteScopeFrequency) || "weekly",
        siteContact: initialServerScope.siteContact ?? "",
        accessNotes: initialServerScope.accessNotes ?? "",
      });
    } else if (local) {
      setScope(local);
    }
    setHydrated(true);
  }, [site.id, initialServerScope]);

  function toggleArea(area: CommercialArea) {
    setAreas((prev) =>
      prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area],
    );
  }

  function toggleDay(day: ServiceDay) {
    setServiceDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  }

  async function persistAndContinue(mode: "quotes" | "book") {
    setSaving(true);
    setStatus(null);
    try {
      if (areas.length === 0) throw new Error("Select at least one area.");
      if (scope.frequency !== "one_time" && serviceDays.length === 0) {
        throw new Error("Pick service days for recurring cleans.");
      }

      const sq = scope.squareFootage.replace(/,/g, "").trim();
      const squareFootage = sq ? Number(sq) : null;
      if (sq && (!Number.isFinite(squareFootage) || (squareFootage ?? 0) < 0)) {
        throw new Error("Enter a valid square footage.");
      }

      const localMirror: SiteScope = {
        ...scope,
        siteId: site.id,
        areas: areas.map(areaLabel).join(", "),
        scheduleWindow:
          scope.scheduleWindow.trim() ||
          (scope.frequency === "one_time"
            ? "One-time window"
            : `${serviceDays.map(dayLabel).join(", ")} · ${scope.scheduleWindow || "Evenings"}`),
        updatedAt: new Date().toISOString(),
      };
      writeSiteScope(localMirror);

      const res = await fetch("/api/commercial/scopes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          siteAddressId: site.id,
          areas,
          frequency: scope.frequency,
          serviceDays: scope.frequency === "one_time" ? [] : serviceDays,
          serviceWindow: scope.scheduleWindow.trim() || "Evenings",
          startDate: null,
          squareFootage,
          siteContact: scope.siteContact.trim() || null,
          accessNotes: scope.accessNotes.trim() || null,
        }),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Unable to save scope.");

      if (mode === "book") {
        const params = new URLSearchParams({ service: "office", siteId: site.id });
        router.push(`${routes.book}?${params.toString()}`);
      } else {
        router.push(routes.dashboardSiteQuotes(site.id));
      }
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Unable to save.");
    } finally {
      setSaving(false);
    }
  }

  if (!hydrated) {
    return (
      <div className="mx-auto max-w-[430px] animate-pulse space-y-4 px-5">
        <div className="h-8 w-48 rounded-lg bg-[var(--ml-dark-surface)]" />
        <div className="h-24 rounded-2xl bg-[var(--ml-dark-surface)]" />
      </div>
    );
  }

  return (
    <div
      className="mx-auto w-full max-w-[430px] space-y-5 px-5 lg:max-w-none"
      style={{ fontFamily: "var(--ml-font-ios)" }}
    >
      <header className="space-y-3">
        <Link
          href={routes.dashboardSites}
          className="inline-flex text-sm font-semibold text-[#04CED2]"
        >
          ← Sites
        </Link>
        <h1 className="text-[1.85rem] font-bold tracking-tight text-white">
          Define the scope
        </h1>
        <div className="flex items-center gap-3 rounded-2xl bg-[var(--ml-dark-surface)] px-4 py-3">
          <SiteKindIcon label={site.label} />
          <div className="min-w-0">
            <p className="truncate font-semibold text-white">{site.label}</p>
            <p className="truncate text-[15px] text-[var(--ml-dark-ink-muted)]">
              {site.addressLine1}
              {site.city ? `, ${site.city}` : ""}
            </p>
          </div>
        </div>
      </header>

      <section className="space-y-2">
        <p className="text-[15px] font-semibold text-white">Areas</p>
        <div className="space-y-2 rounded-2xl bg-[var(--ml-dark-surface)] p-3">
          {COMMERCIAL_AREAS.map((area) => {
            const on = areas.includes(area);
            return (
              <button
                key={area}
                type="button"
                onClick={() => toggleArea(area)}
                className="flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left"
              >
                <span
                  className={cn(
                    "flex size-5 items-center justify-center rounded border",
                    on
                      ? "border-[#04CED2] bg-[#04CED2] text-[#01193D]"
                      : "border-white/35 text-transparent",
                  )}
                  aria-hidden
                >
                  ✓
                </span>
                <span className="text-[16px] text-white">{areaLabel(area)}</span>
              </button>
            );
          })}
        </div>
      </section>

      <label className="block space-y-1.5">
        <span className="text-[15px] font-semibold text-white">Square footage</span>
        <Input
          value={scope.squareFootage}
          onChange={(e) => setScope((s) => ({ ...s, squareFootage: e.target.value }))}
          placeholder="e.g. 4,000"
          className="h-12 rounded-2xl border-[var(--ml-dark-border)] bg-[var(--ml-dark-surface)] text-[16px] text-white"
        />
      </label>

      <section className="space-y-2">
        <p className="text-[15px] font-semibold text-white">Service</p>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setScope((s) => ({ ...s, frequency: "weekly" }))}
            className={cn(
              "rounded-2xl border px-3 py-3 text-sm font-semibold",
              scope.frequency !== "one_time"
                ? "border-[#04CED2] bg-[#04CED2]/15 text-[#04CED2]"
                : "border-[var(--ml-dark-border)] text-white/70",
            )}
          >
            Recurring service
          </button>
          <button
            type="button"
            onClick={() => setScope((s) => ({ ...s, frequency: "one_time" }))}
            className={cn(
              "rounded-2xl border px-3 py-3 text-sm font-semibold",
              scope.frequency === "one_time"
                ? "border-[#04CED2] bg-[#04CED2]/15 text-[#04CED2]"
                : "border-[var(--ml-dark-border)] text-white/70",
            )}
          >
            One-time visit
          </button>
        </div>
        {scope.frequency !== "one_time" ? (
          <div className="flex flex-wrap gap-2 pt-1">
            {FREQUENCIES.filter((f) => f !== "one_time").map((freq) => (
              <button
                key={freq}
                type="button"
                onClick={() => setScope((s) => ({ ...s, frequency: freq }))}
                className={cn(
                  "rounded-xl border px-3 py-2 text-sm font-semibold",
                  scope.frequency === freq
                    ? "border-[#04CED2] text-[#04CED2]"
                    : "border-[var(--ml-dark-border)] text-white/70",
                )}
              >
                {frequencyLabel(freq)}
              </button>
            ))}
          </div>
        ) : null}
      </section>

      {scope.frequency !== "one_time" ? (
        <section className="space-y-2">
          <p className="text-[15px] font-semibold text-white">Service days</p>
          <div className="grid grid-cols-7 gap-1.5">
            {SERVICE_DAYS.map((day) => {
              const on = serviceDays.includes(day);
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(day)}
                  className={cn(
                    "rounded-xl py-2.5 text-xs font-semibold",
                    on
                      ? "bg-[#04CED2] text-[#01193D]"
                      : "bg-[var(--ml-dark-surface)] text-white/70",
                  )}
                >
                  {dayLabel(day)}
                </button>
              );
            })}
          </div>
        </section>
      ) : null}

      <label className="block space-y-1.5">
        <span className="text-[15px] font-semibold text-white">Service time</span>
        <Input
          value={scope.scheduleWindow}
          onChange={(e) => setScope((s) => ({ ...s, scheduleWindow: e.target.value }))}
          placeholder="Evenings · After 6:00 PM"
          className="h-12 rounded-2xl border-[var(--ml-dark-border)] bg-[var(--ml-dark-surface)] text-[16px] text-white"
        />
      </label>

      <label className="block space-y-1.5">
        <span className="text-[15px] font-semibold text-white">Site contact</span>
        <Input
          value={scope.siteContact}
          onChange={(e) => setScope((s) => ({ ...s, siteContact: e.target.value }))}
          placeholder="Front desk · name or phone"
          className="h-12 rounded-2xl border-[var(--ml-dark-border)] bg-[var(--ml-dark-surface)] text-[16px] text-white"
        />
      </label>

      <label className="block space-y-1.5">
        <span className="text-[15px] font-semibold text-white">
          Entry codes / access notes
        </span>
        <Input
          value={scope.accessNotes}
          onChange={(e) => setScope((s) => ({ ...s, accessNotes: e.target.value }))}
          placeholder="Private — only authorized users"
          className="h-12 rounded-2xl border-[var(--ml-dark-border)] bg-[var(--ml-dark-surface)] text-[16px] text-white"
        />
        <p className="text-xs text-[var(--ml-dark-ink-subtle)]">
          Server-enforced: other businesses cannot read these notes.
        </p>
      </label>

      {status ? (
        <p className="text-sm text-red-300" role="alert">
          {status}
        </p>
      ) : null}

      <div className="space-y-2 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <Button
          type="button"
          variant="primary"
          className="h-14 w-full rounded-2xl bg-[#04CED2] text-base font-semibold text-[#01193D] hover:bg-[#03b8bc]"
          disabled={saving}
          onClick={() => void persistAndContinue("quotes")}
        >
          {saving ? "Saving…" : "Continue"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          className="h-12 w-full rounded-2xl border-white/50 bg-transparent font-semibold text-white hover:bg-white/5"
          disabled={saving}
          onClick={() => void persistAndContinue("book")}
        >
          Book this visit
        </Button>
        <p className="text-center text-xs text-[var(--ml-dark-ink-subtle)]">
          Book when approved scope + agreed rate + available crew. Otherwise request quotes —
          we never invent providers.
        </p>
      </div>
    </div>
  );
}
