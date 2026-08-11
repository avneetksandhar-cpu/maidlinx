"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { Button, Card, CardContent } from "@/components/ui";
import { routes } from "@/config/site";
import type { ProJob } from "@/lib/pro/dashboard/jobs";
import {
  formatAddress,
  formatEarnings,
  formatGeneralLocation,
  formatJobDate,
  formatJobTimeRange,
  formatTravelEstimate,
  getDirectionsUrl,
  getServiceLabel,
} from "@/lib/pro/dashboard/display";
import { formatDurationMinutes } from "@/lib/pro/dashboard/duration";

interface JobCardProps {
  job: ProJob;
}

function JobCardShell({
  job,
  children,
  footer,
  revealAddress,
}: {
  job: ProJob;
  children?: React.ReactNode;
  footer: React.ReactNode;
  revealAddress: boolean;
}) {
  const location = revealAddress
    ? formatAddress(
        job.addressLine1,
        job.addressLine2,
        job.addressCity,
        job.addressState,
        job.addressPostalCode,
      )
    : formatGeneralLocation(job.addressCity, job.addressState, job.addressPostalCode);

  const travel = formatTravelEstimate(job.distanceKm, job.travelMinutes);

  return (
    <Card className="overflow-hidden border-border/80 shadow-soft">
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-base font-semibold text-navy">
              {getServiceLabel(job.serviceType)}
            </p>
            <p className="mt-0.5 text-sm text-ink-muted">
              {formatJobDate(job.scheduledAt)} ·{" "}
              {formatJobTimeRange(job.scheduledAt, job.arrivalWindowStart, job.arrivalWindowEnd)}
            </p>
          </div>
          <StatusBadge status={job.status} />
        </div>

        <p className="text-sm leading-relaxed text-ink">{location}</p>

        <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-ink-muted">
          <span>{formatDurationMinutes(job.estimatedDurationMinutes)}</span>
          {travel && <span>{travel}</span>}
          <span>
            {job.bedrooms} bed · {job.bathrooms} bath
          </span>
        </div>

        {children}

        <div className="flex flex-col gap-2 border-t border-border pt-3">{footer}</div>
      </CardContent>
    </Card>
  );
}

export function AvailableJobCard({ job }: JobCardProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAccept() {
    setLoading(true);
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
      setLoading(false);
    }
  }

  return (
    <JobCardShell
      job={job}
      revealAddress={false}
      footer={
        <Button
          variant="gold"
          size="lg"
          className="w-full"
          onClick={handleAccept}
          disabled={loading}
        >
          {loading ? "Accepting…" : "Accept job"}
        </Button>
      }
    >
      <div className="flex items-center justify-between rounded-lg bg-teal-muted/60 px-3 py-2">
        <span className="text-xs font-medium uppercase tracking-wide text-ink-muted">
          You earn
        </span>
        <span className="font-display text-lg font-semibold text-teal">
          {formatEarnings(job.subtotalCents, job.currency)}
        </span>
      </div>
      {error && <p className="text-sm text-error">{error}</p>}
    </JobCardShell>
  );
}

export function AssignedJobCard({ job }: JobCardProps) {
  const directionsUrl = getDirectionsUrl(
    job.addressLine1,
    job.addressCity,
    job.addressState,
    job.addressPostalCode,
    job.addressLatitude,
    job.addressLongitude,
  );

  return (
    <JobCardShell
      job={job}
      revealAddress
      footer={
        <>
          <Link
            href={routes.cleanerJob(job.id)}
            className="inline-flex h-12 w-full items-center justify-center rounded-full bg-teal px-4 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
          >
            Open job
          </Link>
          <a
            href={directionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-12 w-full items-center justify-center rounded-full border border-border-strong bg-surface px-4 text-sm font-medium text-ink transition-colors hover:bg-surface-muted"
          >
            Navigate
          </a>
        </>
      }
    >
      <div className="flex items-center justify-between rounded-lg bg-teal-muted/60 px-3 py-2">
        <span className="text-xs font-medium uppercase tracking-wide text-ink-muted">
          You earn
        </span>
        <span className="font-display text-lg font-semibold text-teal">
          {formatEarnings(job.subtotalCents, job.currency)}
        </span>
      </div>
    </JobCardShell>
  );
}

/** @deprecated Use AssignedJobCard */
export const ScheduleJobCard = AssignedJobCard;

export function HistoryJobCard({ job }: JobCardProps) {
  return (
    <JobCardShell
      job={job}
      revealAddress
      footer={
        <Link
          href={routes.cleanerJob(job.id)}
          className="inline-flex h-12 w-full items-center justify-center rounded-full border border-border-strong bg-surface px-4 text-sm font-medium text-ink transition-colors hover:bg-surface-muted"
        >
          View details
        </Link>
      }
    >
      <div className="flex items-center justify-between text-sm">
        <span className="text-ink-muted">Earned</span>
        <span className="font-display font-semibold text-teal">
          {formatEarnings(job.subtotalCents, job.currency)}
        </span>
      </div>
    </JobCardShell>
  );
}
