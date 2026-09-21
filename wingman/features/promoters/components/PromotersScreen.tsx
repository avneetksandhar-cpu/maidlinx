"use client";

import { SearchIcon, VerifiedBadge } from "@/components/icons";
import { AppHeader } from "@/components/layout/AppHeader";
import { AppShell } from "@/components/layout/AppShell";
import { SampleMark } from "@/components/ui/SampleMark";
import {
  promoterFilters,
  promoters,
  type Promoter,
  type PromoterFilterId,
} from "@/features/promoters/data/promoters";
import { formatSampleFromPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

function PromoterCard({ promoter }: { promoter: Promoter }) {
  return (
    <Link
      href={`/promoters/${promoter.id}`}
      className="flex gap-3 overflow-hidden rounded-2xl border border-border bg-surface p-3"
    >
      <div className="relative h-[5.75rem] w-[5.75rem] shrink-0 overflow-hidden rounded-xl">
        <Image
          src={promoter.photoUrl}
          alt={promoter.photoAlt}
          fill
          className="object-cover"
          sizes="92px"
        />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <h3 className="truncate text-lg text-ink">{promoter.name}</h3>
          {promoter.verified ? (
            <span className="text-accent" title="Verified badge as it would appear">
              <VerifiedBadge />
            </span>
          ) : null}
        </div>
        <p className="mt-0.5 truncate text-xs text-ink-muted">{promoter.venues.join(" · ")}</p>
        <p className="mt-2 text-xs text-ink-muted">
          <span className="text-accent">{promoter.availability}</span>
          <span className="mx-1.5 text-border-subtle">·</span>
          {promoter.accessOffered}
        </p>
        <div className="mt-2 flex items-center justify-between">
          <p className="text-sm text-accent">{formatSampleFromPrice(promoter.minimumSpend)}</p>
          <SampleMark>Demo</SampleMark>
        </div>
      </div>
    </Link>
  );
}

export function PromotersScreen() {
  const [filter, setFilter] = useState<PromoterFilterId>("all");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    return promoters.filter((promoter) => {
      const matchesFilter =
        filter === "all" ||
        promoter.availabilityFilter === filter ||
        promoter.category === filter;
      const q = query.trim().toLowerCase();
      const matchesQuery =
        !q ||
        promoter.name.toLowerCase().includes(q) ||
        promoter.venues.some((venue) => venue.toLowerCase().includes(q)) ||
        promoter.accessOffered.toLowerCase().includes(q);
      return matchesFilter && matchesQuery;
    });
  }, [filter, query]);

  return (
    <AppShell showNav noPadding>
      <div className="px-5">
        <AppHeader showMenu showNotifications />
        <h1 className="text-3xl tracking-tight text-ink">Verified Wingman profiles</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Sample directory. These are not live staff or venue partnerships. Your evening still goes
          through one Wingman.
        </p>

        <div className="relative mt-5">
          <input
            type="search"
            placeholder="Search sample profiles"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="w-full rounded-full border border-border bg-surface py-3.5 pl-11 pr-4 text-sm text-ink placeholder:text-ink-subtle focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/30"
          />
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-subtle">
            <SearchIcon />
          </span>
        </div>
      </div>

      <div className="mt-4 flex gap-2 overflow-x-auto px-5 pb-1 scrollbar-none">
        {promoterFilters.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setFilter(item.id)}
            className={cn(
              "shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors",
              filter === item.id
                ? "bg-cobalt text-ink"
                : "border border-border bg-surface text-ink-muted",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="mt-4 flex flex-col gap-3 px-5 pb-6">
        {filtered.length === 0 ? (
          <p className="py-12 text-center text-sm text-ink-muted">No profiles match your search.</p>
        ) : (
          filtered.map((promoter) => <PromoterCard key={promoter.id} promoter={promoter} />)
        )}
      </div>
    </AppShell>
  );
}
