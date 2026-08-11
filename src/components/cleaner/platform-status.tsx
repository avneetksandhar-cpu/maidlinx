"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { routes } from "@/config/site";
import { PLATFORM_STAGE_LABELS, type PlatformStage } from "@/lib/cleaners/platform";

interface PlatformPayload {
  platformStage: PlatformStage;
  canTakeJobs: boolean;
  gates: {
    allowed: boolean;
    failedGates: string[];
    evaluations: Array<{
      gateKey: string;
      label: string;
      passed: boolean;
      reason: string;
      required: boolean;
      enabled: boolean;
    }>;
  };
  trust: {
    trustScore: number;
    reliabilityScore: number;
    maidlinxVerified: boolean;
    seriousFlagCount: number;
  } | null;
}

export function CleanerPlatformStatus() {
  const [data, setData] = useState<PlatformPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/cleaner/platform")
      .then((res) => res.json().then((json) => ({ res, json })))
      .then(({ res, json }) => {
        if (cancelled) return;
        if (!res.ok) {
          setError(json.error ?? "Unable to load platform status.");
          return;
        }
        setData(json.data as PlatformPayload);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <div className="rounded-xl border border-border bg-surface px-4 py-3 text-sm text-ink-muted">
        {error}
      </div>
    );
  }

  if (!data) {
    return <div className="h-28 animate-pulse rounded-xl bg-border" />;
  }

  const stageLabel = PLATFORM_STAGE_LABELS[data.platformStage] ?? data.platformStage;

  return (
    <section className="rounded-xl border border-border bg-surface p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">
            MaidLinx Verified Network
          </p>
          <h2 className="mt-1 font-display text-lg font-semibold text-navy">
            Stage: {stageLabel}
          </h2>
          <p className="mt-1 text-sm text-ink-muted">
            {data.canTakeJobs
              ? "You are cleared for marketplace jobs."
              : "Complete verification gates before real jobs. Providers pending ≠ auto-approved."}
          </p>
        </div>
        {data.trust?.maidlinxVerified ? (
          <span className="rounded-md bg-teal-muted px-2.5 py-1 text-xs font-semibold text-navy">
            MaidLinx Verified
          </span>
        ) : (
          <span className="rounded-md bg-surface-muted px-2.5 py-1 text-xs font-medium text-ink-muted">
            Not verified yet
          </span>
        )}
      </div>

      <ul className="mt-4 grid gap-2 sm:grid-cols-2">
        {data.gates.evaluations
          .filter((g) => g.enabled)
          .map((g) => (
            <li
              key={g.gateKey}
              className="flex items-start justify-between gap-2 rounded-lg bg-surface-muted px-3 py-2 text-sm"
            >
              <span className="text-ink">{g.label}</span>
              <span className={g.passed ? "text-success" : "text-ink-muted"}>
                {g.passed ? "Pass" : "Pending"}
              </span>
            </li>
          ))}
      </ul>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href={routes.cleanerApplication}
          className="inline-flex h-9 items-center rounded-lg bg-surface-muted px-3 text-sm font-medium text-ink hover:bg-border"
        >
          Application
        </Link>
        <Link
          href={routes.cleanerVerification}
          className="inline-flex h-9 items-center rounded-lg bg-surface-muted px-3 text-sm font-medium text-ink hover:bg-border"
        >
          Verification
        </Link>
        <Link
          href={routes.cleanerTraining}
          className="inline-flex h-9 items-center rounded-lg bg-surface-muted px-3 text-sm font-medium text-ink hover:bg-border"
        >
          Academy
        </Link>
        <Link
          href={routes.cleanerPerformance}
          className="inline-flex h-9 items-center rounded-lg px-3 text-sm font-medium text-ink-muted hover:text-ink"
        >
          Performance
        </Link>
      </div>
    </section>
  );
}
