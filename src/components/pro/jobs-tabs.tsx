"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { routes } from "@/config/site";
import { cn } from "@/lib/utils";

export type JobsTab = "today" | "upcoming";

const TABS: { id: JobsTab; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "upcoming", label: "Upcoming" },
];

interface JobsTabsProps {
  counts: {
    today: number;
    upcoming: number;
  };
}

export function JobsTabs({ counts }: JobsTabsProps) {
  const pathname = usePathname() ?? routes.cleanerJobs;
  const searchParams = useSearchParams();
  const active = (searchParams?.get("tab") as JobsTab) || "today";

  return (
    <div
      className="mb-5 grid grid-cols-2 gap-1 rounded-full bg-[var(--ml-dark-surface)] p-1 ring-1 ring-[var(--ml-dark-border)]"
      role="tablist"
      aria-label="Jobs"
    >
      {TABS.map((tab) => {
        const href = tab.id === "today" ? pathname : `${pathname}?tab=${tab.id}`;
        const count = counts[tab.id];
        const selected = active === tab.id;
        return (
          <Link
            key={tab.id}
            href={href}
            role="tab"
            aria-selected={selected}
            className={cn(
              "inline-flex min-h-11 items-center justify-center gap-1.5 rounded-full px-4 text-sm font-semibold transition-colors",
              selected
                ? "bg-[var(--ml-dark-mint)] text-[var(--ml-app-header-ink)]"
                : "text-[var(--ml-dark-ink-muted)] hover:text-[var(--ml-dark-ink)]",
            )}
          >
            {tab.label}
            {count > 0 ? (
              <span
                className={cn(
                  "tabular-nums text-xs",
                  selected ? "text-[var(--ml-app-header-ink)]/80" : "text-[var(--ml-dark-mint)]",
                )}
              >
                {count}
              </span>
            ) : null}
          </Link>
        );
      })}
    </div>
  );
}
