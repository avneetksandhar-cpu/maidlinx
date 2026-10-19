"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ChevronRight, Home } from "lucide-react";
import { routes } from "@/config/site";
import type { ProJob } from "@/lib/pro/dashboard/jobs";
import {
  formatJobDate,
  formatJobTimeRange,
  formatPropertyLabel,
  getServiceLabel,
} from "@/lib/pro/dashboard/display";
import { cn } from "@/lib/utils";

interface JobCardProps {
  job: ProJob;
}

const DECLINED_KEY = "ml.cleaner.declinedJobs";

function readDeclined(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = sessionStorage.getItem(DECLINED_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? new Set(parsed.filter((x) => typeof x === "string")) : new Set();
  } catch {
    return new Set();
  }
}

function writeDeclined(ids: Set<string>) {
  sessionStorage.setItem(DECLINED_KEY, JSON.stringify([...ids]));
}

function JobMeta({ job, showNew }: { job: ProJob; showNew?: boolean }) {
  return (
    <>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-[var(--ml-dark-ink)]">
          {formatJobDate(job.scheduledAt)},{" "}
          {formatJobTimeRange(job.scheduledAt, job.arrivalWindowStart, job.arrivalWindowEnd)}
        </p>
        {showNew ? (
          <span className="shrink-0 rounded-md bg-[var(--ml-dark-mint)] px-2 py-0.5 text-[11px] font-bold tracking-wide text-[var(--color-accent-foreground)]">
            New
          </span>
        ) : null}
      </div>

      <div className="flex items-center gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[var(--ml-dark-surface-2)] text-[var(--ml-dark-ink-muted)]">
          <Home className="size-5" strokeWidth={1.75} aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-[var(--ml-dark-ink)]">
            {formatPropertyLabel(job)}
          </p>
          <p className="truncate text-sm text-[var(--ml-dark-ink-muted)]">
            {getServiceLabel(job.serviceType)}
          </p>
        </div>
        <ChevronRight className="size-5 shrink-0 text-[var(--ml-dark-ink-subtle)]" aria-hidden />
      </div>
    </>
  );
}

export function AvailableJobCard({ job }: JobCardProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<"accept" | "decline" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hidden, setHidden] = useState(false);

  if (hidden) return null;

  async function handleAccept() {
    setLoading("accept");
    setError(null);
    try {
      const response = await fetch(`/api/cleaner/jobs/${job.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "accept" }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Unable to accept job.");
      router.push(routes.cleanerJob(job.id));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to accept job.");
    } finally {
      setLoading(null);
    }
  }

  function handleDecline() {
    setLoading("decline");
    // No decline API for open marketplace listings — honest session dismiss only.
    const next = readDeclined();
    next.add(job.id);
    writeDeclined(next);
    setHidden(true);
    setLoading(null);
  }

  return (
    <article className="overflow-hidden rounded-2xl border border-[var(--ml-dark-border)] bg-[var(--ml-dark-surface)] p-4 shadow-[var(--shadow-card)]">
      <div className="space-y-3">
        <JobMeta job={job} showNew />
        {error ? <p className="text-sm text-error">{error}</p> : null}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            disabled={loading !== null}
            onClick={handleDecline}
            className={cn(
              "inline-flex h-12 items-center justify-center rounded-2xl border border-[var(--ml-dark-border-strong)] bg-transparent text-sm font-semibold text-[var(--ml-dark-ink)]",
              "active:bg-[var(--ml-dark-surface-2)] disabled:opacity-60",
            )}
          >
            {loading === "decline" ? "…" : "Decline"}
          </button>
          <button
            type="button"
            disabled={loading !== null}
            onClick={() => void handleAccept()}
            className={cn(
              "inline-flex h-12 items-center justify-center rounded-2xl bg-[var(--ml-dark-mint)] text-sm font-semibold text-[var(--color-accent-foreground)]",
              "active:opacity-90 disabled:opacity-60",
            )}
          >
            {loading === "accept" ? "Accepting…" : "Accept job"}
          </button>
        </div>
      </div>
    </article>
  );
}

export function AssignedJobCard({ job }: JobCardProps) {
  return (
    <Link
      href={routes.cleanerJob(job.id)}
      className="block overflow-hidden rounded-2xl border border-[var(--ml-dark-border)] bg-[var(--ml-dark-surface)] p-4 shadow-[var(--shadow-card)] active:bg-[var(--ml-dark-surface-2)]"
    >
      <div className="space-y-3">
        <JobMeta job={job} />
      </div>
    </Link>
  );
}

/** @deprecated Use AssignedJobCard */
export const ScheduleJobCard = AssignedJobCard;

export function HistoryJobCard({ job }: JobCardProps) {
  return (
    <Link
      href={routes.cleanerJob(job.id)}
      className="block overflow-hidden rounded-2xl border border-[var(--ml-dark-border)] bg-[var(--ml-dark-surface)] p-4"
    >
      <div className="space-y-3">
        <JobMeta job={job} />
      </div>
    </Link>
  );
}
