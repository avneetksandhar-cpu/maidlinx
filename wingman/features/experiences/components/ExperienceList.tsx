"use client";

import { AppHeader } from "@/components/layout/AppHeader";
import { AppShell } from "@/components/layout/AppShell";
import { SampleMark } from "@/components/ui/SampleMark";
import { featuredExperiences, type ExperienceCategory } from "@/features/home/data/experiences";
import { formatSampleFromPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

const filters: Array<{ id: "all" | "tonight" | ExperienceCategory; label: string }> = [
  { id: "all", label: "All" },
  { id: "tonight", label: "Tonight" },
  { id: "dining", label: "Dining" },
  { id: "yachts", label: "Yachts" },
  { id: "events", label: "Events" },
];

export function ExperienceListScreen() {
  const [filter, setFilter] = useState<(typeof filters)[number]["id"]>("all");

  const list = useMemo(() => {
    if (filter === "all") return featuredExperiences;
    if (filter === "tonight") {
      return featuredExperiences.filter((item) => item.featured || item.dateLabel === "Tonight");
    }
    return featuredExperiences.filter((item) => item.category === filter);
  }, [filter]);

  return (
    <AppShell showNav noPadding>
      <div className="px-5">
        <AppHeader title="Evening ideas" showBack backHref="/home" />
        <p className="mb-4 text-sm text-ink-muted">
          Sample ideas only — not live inventory or venue partnerships.
        </p>
      </div>
      <div className="mb-4 flex gap-2 overflow-x-auto px-5 scrollbar-none">
        {filters.map((item) => (
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
      <div className="flex flex-col gap-3 px-5 pb-6">
        {list.map((exp) => (
          <Link
            key={exp.id}
            href={`/experiences/${exp.id}`}
            className="flex gap-3 overflow-hidden rounded-2xl border border-border bg-surface p-2"
          >
            <div className="relative h-24 w-28 shrink-0 overflow-hidden rounded-xl">
              <Image src={exp.imageUrl} alt={exp.imageAlt} fill className="object-cover" sizes="112px" />
            </div>
            <div className="flex min-w-0 flex-1 flex-col justify-center pr-2">
              <div className="flex items-start justify-between gap-2">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-accent">
                  {exp.categoryLabel}
                </p>
                <SampleMark>Sample</SampleMark>
              </div>
              <h3 className="mt-0.5 truncate text-lg text-ink">{exp.title}</h3>
              <p className="truncate text-xs text-ink-muted">{exp.location}</p>
              <p className="mt-1 text-sm text-accent">{formatSampleFromPrice(exp.priceFrom)}</p>
            </div>
          </Link>
        ))}
      </div>
    </AppShell>
  );
}
