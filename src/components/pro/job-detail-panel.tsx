"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Calendar, FileText, MapPin, Navigation } from "lucide-react";
import { JobChecklist } from "@/components/pro/job-checklist";
import { PhotoUpload } from "@/components/pro/photo-upload";
import type { JobPhoto, ProJob } from "@/lib/pro/dashboard/jobs";
import {
  formatAddress,
  formatEntryDetails,
  formatJobDate,
  formatJobTimeRange,
  formatPropertyLabel,
  getDirectionsUrl,
  getServiceLabel,
} from "@/lib/pro/dashboard/display";
import {
  getActionForNextStatus,
  getActionLabel,
  type CleanerJobAction,
} from "@/lib/pro/job-transitions";
import { normalizeBookingStatus } from "@/lib/bookings/status";
import { cn } from "@/lib/utils";

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
  const status = normalizeBookingStatus(job.status);
  const isCompleted = status === "completed";
  const isProgress = status === "in_progress";
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

  const address = job.addressRevealed
    ? formatAddress(
        job.addressLine1,
        job.addressLine2,
        job.addressCity,
        job.addressState,
        job.addressPostalCode,
      )
    : "Exact address available after accept";

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
    <div className="space-y-6 pb-28">
      {/* Property summary */}
      <div className="flex items-center gap-3 rounded-2xl border border-[var(--ml-dark-border)] bg-[var(--ml-dark-surface)] p-3">
        <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[var(--ml-dark-surface-2)] text-[var(--ml-dark-ink-muted)]">
          <MapPin className="size-7" strokeWidth={1.5} aria-hidden />
        </div>
        <div className="min-w-0">
          <p className="truncate text-lg font-semibold text-[var(--ml-dark-ink)]">
            {formatPropertyLabel(job)}
          </p>
          <p className="truncate text-sm text-[var(--ml-dark-ink-muted)]">
            {getServiceLabel(job.serviceType)}
          </p>
        </div>
      </div>

      {/* Detail rows */}
      <ul className="space-y-4">
        <li className="flex gap-3">
          <Calendar className="mt-0.5 size-5 shrink-0 text-[var(--ml-dark-mint)]" aria-hidden />
          <p className="text-[15px] text-[var(--ml-dark-ink)]">
            {formatJobDate(job.scheduledAt)},{" "}
            {formatJobTimeRange(job.scheduledAt, job.arrivalWindowStart, job.arrivalWindowEnd)}
          </p>
        </li>
        <li className="flex gap-3">
          <MapPin className="mt-0.5 size-5 shrink-0 text-[var(--ml-dark-mint)]" aria-hidden />
          <p className="text-[15px] leading-snug text-[var(--ml-dark-ink)]">{address}</p>
        </li>
        <li className="flex gap-3">
          <FileText className="mt-0.5 size-5 shrink-0 text-[var(--ml-dark-mint)]" aria-hidden />
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-[var(--ml-dark-ink-muted)]">
              Entry details
            </p>
            <p className="mt-0.5 text-[15px] leading-snug text-[var(--ml-dark-ink)]">
              {formatEntryDetails(job.notes)}
            </p>
          </div>
        </li>
      </ul>

      {!isCompleted ? (
        <JobChecklist
          jobId={job.id}
          items={job.jobChecklist}
          disabled={checklistDisabled}
          showProgressBar={isProgress}
        />
      ) : null}

      {isProgress && !isCompleted ? (
        <>
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
      ) : null}

      {error ? <p className="text-sm text-error">{error}</p> : null}

      {/* Sticky footer action */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--ml-dark-border)] bg-[var(--ml-dark-bg)]/95 px-4 pt-3 backdrop-blur-md pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:static lg:border-0 lg:bg-transparent lg:p-0 lg:backdrop-blur-none">
        <div className="mx-auto flex max-w-lg flex-col gap-2">
          {isProgress && nextAction === "complete" ? (
            <button
              type="button"
              disabled={loading !== null}
              onClick={() => void runAction("complete")}
              className={cn(
                "inline-flex h-14 w-full items-center justify-center rounded-2xl bg-[var(--ml-dark-mint)] text-base font-semibold text-[var(--color-accent-foreground)]",
                "active:opacity-90 disabled:opacity-60",
              )}
            >
              {loading === "complete" ? "Completing…" : "Complete job"}
            </button>
          ) : (
            <>
              {nextAction && nextAction !== "complete" ? (
                <button
                  type="button"
                  disabled={loading !== null}
                  onClick={() => void runAction(nextAction)}
                  className={cn(
                    "inline-flex h-12 w-full items-center justify-center rounded-2xl border border-[var(--ml-dark-border-strong)] text-sm font-semibold text-[var(--ml-dark-ink)]",
                    "active:bg-[var(--ml-dark-surface-2)] disabled:opacity-60",
                  )}
                >
                  {loading === nextAction ? "Updating…" : getActionLabel(nextAction)}
                </button>
              ) : null}
              <a
                href={directionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[var(--ml-dark-mint)] text-base font-semibold text-[var(--color-accent-foreground)] active:opacity-90"
              >
                <Navigation className="size-5" strokeWidth={2.25} aria-hidden />
                Open directions
              </a>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
