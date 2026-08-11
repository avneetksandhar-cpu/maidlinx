"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { routes } from "@/config/site";
import { cn } from "@/lib/utils";

export type JobsTab = "today" | "available" | "upcoming" | "earnings";

const TABS: { id: JobsTab; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "available", label: "Available" },
  { id: "upcoming", label: "Upcoming" },
  { id: "earnings", label: "Earnings" },
];

interface JobsTabsProps {
  counts: {
    today: number;
    available: number;
    upcoming: number;
  };
}

export function JobsTabs({ counts }: JobsTabsProps) {
  const pathname = usePathname() ?? routes.cleanerDashboard;
  const searchParams = useSearchParams();
  const active = (searchParams?.get("tab") as JobsTab) || "today";

  return (
    <div className="mb-5 grid grid-cols-4 gap-1 rounded-xl bg-navy/5 p-1">
      {TABS.map((tab) => {
        const href =
          tab.id === "today" ? pathname : `${pathname}?tab=${tab.id}`;
        const count =
          tab.id === "earnings" ? null : counts[tab.id as keyof typeof counts];
        return (
          <Link
            key={tab.id}
            href={href}
            className={cn(
              "flex min-h-12 flex-col items-center justify-center rounded-lg px-1 py-2 text-center transition-colors",
              active === tab.id
                ? "bg-surface text-navy shadow-sm"
                : "text-ink-muted hover:text-ink",
            )}
          >
            <span className="text-[11px] font-semibold uppercase tracking-wide sm:text-xs">
              {tab.label}
            </span>
            {count != null && (
              <span className="text-[11px] tabular-nums text-teal">{count}</span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
