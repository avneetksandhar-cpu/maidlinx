"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CalendarDays, Layers, Ruler, Users } from "lucide-react";
import { SiteKindIcon } from "@/components/business/site-kind-icon";
import { Button, Input } from "@/components/ui";
import type { SavedAddress } from "@/lib/addresses/types";
import {
  emptySiteScope,
  frequencyLabel,
  isScopeReadyForQuote,
  readSiteScope,
  writeSiteScope,
  type SiteScope,
  type SiteScopeFrequency,
} from "@/lib/business/site-scope";
import { routes } from "@/config/site";
import { cn } from "@/lib/utils";

const FREQUENCIES: SiteScopeFrequency[] = [
  "one_time",
  "weekly",
  "biweekly",
  "monthly",
  "custom",
];

interface DefineScopeFormProps {
  site: SavedAddress;
}

/**
 * Screen 2 — Define the scope for a commercial site.
 * Saves locally for reuse; primary CTA requests quotes (or book when priced).
 */
export function DefineScopeForm({ site }: DefineScopeFormProps) {
  const router = useRouter();
  const [scope, setScope] = useState<SiteScope>(() => emptySiteScope(site.id));
  const [hydrated, setHydrated] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);

  useEffect(() => {
    const existing = readSiteScope(site.id);
    if (existing) setScope(existing);
    setHydrated(true);
  }, [site.id]);

  function patch(partial: Partial<SiteScope>) {
    setScope((prev) => {
      const next = { ...prev, ...partial, siteId: site.id };
      writeSiteScope(next);
      return next;
    });
    setSavedFlash(true);
    window.setTimeout(() => setSavedFlash(false), 1200);
  }

  function continueToQuotes() {
    writeSiteScope(scope);
    router.push(routes.dashboardSiteQuotes(site.id));
  }

  function bookThisVisit() {
    writeSiteScope(scope);
    const params = new URLSearchParams({
      service: "office",
      siteId: site.id,
    });
    router.push(`${routes.book}?${params.toString()}`);
  }

  if (!hydrated) {
    return (
      <div className="mx-auto max-w-[430px] animate-pulse space-y-4">
        <div className="h-8 w-48 rounded-lg bg-[var(--ml-dark-surface)]" />
        <div className="h-24 rounded-2xl bg-[var(--ml-dark-surface)]" />
      </div>
    );
  }

  const ready = isScopeReadyForQuote(scope);

  return (
    <div className="mx-auto w-full max-w-[430px] space-y-5 lg:max-w-none">
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
        <div className="flex items-center gap-3 rounded-2xl border border-[var(--ml-dark-border)] bg-[var(--ml-dark-surface)] px-4 py-3">
          <SiteKindIcon label={site.label} />
          <div className="min-w-0">
            <p className="truncate font-semibold text-white">{site.label}</p>
            <p className="truncate text-sm text-[var(--ml-dark-ink-muted)]">
              {site.addressLine1}
              {site.city ? `, ${site.city}` : ""}
            </p>
          </div>
        </div>
        {savedFlash ? (
          <p className="text-xs font-medium text-[#04CED2]" role="status">
            Scope saved for this site
          </p>
        ) : null}
      </header>

      <div className="space-y-2 rounded-2xl border border-[var(--ml-dark-border)] bg-[var(--ml-dark-surface)] px-3 py-2">
        <ScopeField
          icon={<Ruler className="size-5" strokeWidth={1.85} aria-hidden />}
          label="Square footage"
          value={scope.squareFootage}
          placeholder="e.g. 4,000"
          onChange={(v) => patch({ squareFootage: v })}
        />
        <ScopeField
          icon={<Users className="size-5" strokeWidth={1.85} aria-hidden />}
          label="Restrooms"
          value={scope.restrooms}
          placeholder="e.g. 2"
          onChange={(v) => patch({ restrooms: v })}
        />
        <ScopeField
          icon={<Layers className="size-5" strokeWidth={1.85} aria-hidden />}
          label="Areas & tasks"
          value={scope.areas}
          placeholder="Floors & common areas"
          onChange={(v) => patch({ areas: v })}
        />
        <ScopeField
          icon={<CalendarDays className="size-5" strokeWidth={1.85} aria-hidden />}
          label="Schedule window"
          value={scope.scheduleWindow}
          placeholder="Mon, Wed, Fri · After 6 PM"
          onChange={(v) => patch({ scheduleWindow: v })}
        />
      </div>

      <div className="space-y-2">
        <p className="text-sm font-semibold text-white">Frequency</p>
        <div className="flex flex-wrap gap-2">
          {FREQUENCIES.map((freq) => (
            <button
              key={freq}
              type="button"
              onClick={() => patch({ frequency: freq })}
              className={cn(
                "rounded-xl border px-3 py-2 text-sm font-semibold transition-colors",
                scope.frequency === freq
                  ? "border-[#04CED2] bg-[#04CED2]/15 text-[#04CED2]"
                  : "border-[var(--ml-dark-border)] text-white/70 hover:border-white/40",
              )}
            >
              {frequencyLabel(freq)}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-semibold text-white">Site contact</p>
        <Input
          value={scope.siteContact}
          onChange={(e) => patch({ siteContact: e.target.value })}
          placeholder="Front desk · name or phone"
          className="h-12 rounded-2xl border-[var(--ml-dark-border)] bg-[var(--ml-dark-surface)] text-white"
        />
        <Input
          value={scope.accessNotes}
          onChange={(e) => patch({ accessNotes: e.target.value })}
          placeholder="Access notes (optional)"
          className="h-12 rounded-2xl border-[var(--ml-dark-border)] bg-[var(--ml-dark-surface)] text-white"
        />
      </div>

      <div className="space-y-2 pb-4">
        <Button
          type="button"
          variant="primary"
          className="h-14 w-full rounded-2xl bg-[#04CED2] text-base font-semibold text-[#01193D] hover:bg-[#03b8bc]"
          disabled={!ready}
          onClick={continueToQuotes}
        >
          Request quotes
        </Button>
        <Button
          type="button"
          variant="secondary"
          className="h-12 w-full rounded-2xl border-white/50 bg-transparent font-semibold text-white hover:bg-white/5"
          onClick={bookThisVisit}
        >
          Book this visit
        </Button>
        <p className="text-center text-xs text-[var(--ml-dark-ink-subtle)]">
          Book when price + availability are confirmed. Otherwise request quotes — we never invent providers.
        </p>
      </div>
    </div>
  );
}

function ScopeField({
  icon,
  label,
  value,
  placeholder,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  placeholder: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex items-center gap-3 border-b border-[var(--ml-dark-border)] px-1 py-3 last:border-0">
      <span className="text-[#04CED2]">{icon}</span>
      <span className="sr-only">{label}</span>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={label}
        className="h-10 border-0 bg-transparent px-0 text-[15px] font-medium text-white shadow-none placeholder:text-white/35 focus-visible:ring-0"
      />
    </label>
  );
}
