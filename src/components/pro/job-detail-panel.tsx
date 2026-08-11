"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { JobChecklist } from "@/components/pro/job-checklist";
import { PhotoUpload } from "@/components/pro/photo-upload";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { Button, Card, CardContent } from "@/components/ui";
import type { JobPhoto, ProJob } from "@/lib/pro/dashboard/jobs";
import {
  formatAddress,
  formatEarnings,
  formatJobDate,
  formatJobTimeRange,
  getDirectionsUrl,
  getServiceLabel,
} from "@/lib/pro/dashboard/display";
import {
  getActionForNextStatus,
  getActionLabel,
  type CleanerJobAction,
} from "@/lib/pro/job-transitions";

interface JobDetailPanelProps {
  job: ProJob;
  photos: JobPhoto[];
}

export function JobDetailPanel({ job, photos }: JobDetailPanelProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<CleanerJobAction | null>(null);
  const [error, setError] = useState<string | null>(null);

  const beforePhotos = photos.filter((p) => p.photoType === "before");
  const afterPhotos = photos.filter((p) => p.photoType === "after");
  const isCompleted = job.status === "completed";
  const nextAction = getActionForNextStatus(job.status);
  const checklistDisabled = isCompleted;

  const directionsUrl = getDirectionsUrl(
    job.addressLine1,
    job.addressCity,
    job.addressState,
    job.addressPostalCode,
    job.addressLatitude,
    job.addressLongitude,
  );

  async function runAction(action: CleanerJobAction) {
    setLoading(action);
    setError(null);
    try {
      const response = await fetch(`/api/cleaner/jobs/${job.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Action failed.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-display text-xl font-semibold text-ink">
                {getServiceLabel(job.serviceType)}
              </p>
              <p className="mt-1 text-sm text-ink-muted">
                {formatJobDate(job.scheduledAt)} ·{" "}
                {formatJobTimeRange(job.scheduledAt, job.arrivalWindowStart, job.arrivalWindowEnd)}
              </p>
            </div>
            <StatusBadge status={job.status} />
          </div>

          <div className="grid gap-3 text-sm sm:grid-cols-2">
            <div className="sm:col-span-2">
              <p className="text-ink-subtle">Address</p>
              <p className="text-ink">
                {job.addressRevealed
                  ? formatAddress(
                      job.addressLine1,
                      job.addressLine2,
                      job.addressCity,
                      job.addressState,
                      job.addressPostalCode,
                    )
                  : "Exact address available after accept"}
              </p>
            </div>
            <div>
              <p className="text-ink-subtle">Est. duration</p>
              <p className="text-ink">
                {Math.round(job.estimatedDurationMinutes / 60) > 0
                  ? `${Math.floor(job.estimatedDurationMinutes / 60)} hr ${job.estimatedDurationMinutes % 60} min`
                  : `${job.estimatedDurationMinutes} min`}
              </p>
            </div>
            <div>
              <p className="text-ink-subtle">Earnings</p>
              <p className="font-display text-lg font-semibold text-teal">
                {formatEarnings(job.subtotalCents, job.currency)}
              </p>
            </div>
            {job.customerFirstName && (
              <div>
                <p className="text-ink-subtle">Customer</p>
                <p className="text-ink">{job.customerFirstName}</p>
              </div>
            )}
            {job.customerPhone && !isCompleted && (
              <div>
                <p className="text-ink-subtle">Contact</p>
                <a href={`tel:${job.customerPhone}`} className="font-medium text-gold hover:text-gold-hover">
                  {job.customerPhone}
                </a>
              </div>
            )}
            {job.notes && (
              <div className="sm:col-span-2">
                <p className="text-ink-subtle">Notes</p>
                <p className="text-ink">{job.notes}</p>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2 border-t border-border pt-4 sm:flex-row sm:flex-wrap">
            {nextAction && (
              <Button
                variant="gold"
                size="lg"
                className="w-full sm:w-auto"
                disabled={loading !== null}
                onClick={() => runAction(nextAction)}
              >
                {loading === nextAction ? "Updating…" : getActionLabel(nextAction)}
              </Button>
            )}
            <a
              href={directionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-11 w-full items-center justify-center rounded-full border border-border-strong bg-surface px-6 text-sm font-medium text-ink transition-colors hover:bg-surface-muted sm:w-auto"
            >
              Navigate
            </a>
          </div>

          {error && <p className="text-sm text-error">{error}</p>}
        </CardContent>
      </Card>

      {!isCompleted && (
        <>
          <JobChecklist jobId={job.id} items={job.jobChecklist} disabled={checklistDisabled} />
          <PhotoUpload
            jobId={job.id}
            photoType="before"
            photos={beforePhotos}
            disabled={checklistDisabled}
          />
          <PhotoUpload
            jobId={job.id}
            photoType="after"
            photos={afterPhotos}
            disabled={checklistDisabled}
          />
        </>
      )}
    </div>
  );
}
