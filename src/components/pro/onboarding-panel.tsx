"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui";
import { routes } from "@/config/site";
import {
  ONBOARDING_STEP_LABELS,
  ONBOARDING_STEPS,
  type CleanerOnboardingStatus,
  type OnboardingChecklist,
  type OnboardingStepId,
} from "@/lib/cleaners/onboarding";
import { cn } from "@/lib/utils";

const ACTIONABLE = ONBOARDING_STEPS.filter((s) => s !== "approval");

export function OnboardingPanel({
  status,
  checklist,
  rejectionReason,
  progress,
}: {
  status: CleanerOnboardingStatus;
  checklist: OnboardingChecklist;
  rejectionReason: string | null;
  progress: { completed: number; total: number; percent: number; nextStep: OnboardingStepId | null };
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  async function markStep(step: OnboardingStepId, extras?: Record<string, unknown>) {
    setMessage(null);
    startTransition(async () => {
      const res = await fetch("/api/cleaner/onboarding", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step, complete: true, ...extras }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage(json?.error ?? "Could not save step.");
        return;
      }
      router.refresh();
    });
  }

  async function submit() {
    setMessage(null);
    startTransition(async () => {
      const res = await fetch("/api/cleaner/onboarding", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "submit" }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage(json?.error ?? "Could not submit.");
        return;
      }
      setMessage("Application submitted. MaidLinx ops will review — this is not a background check.");
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-surface px-4 py-4">
        <p className="text-sm text-ink-muted">Application status</p>
        <p className="mt-1 font-display text-xl font-semibold text-navy">{status}</p>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-muted">
          <div
            className="h-full rounded-full bg-teal transition-all"
            style={{ width: `${progress.percent}%` }}
          />
        </div>
        <p className="mt-2 text-sm text-ink-muted">
          {progress.completed}/{progress.total} steps · {progress.percent}%
        </p>
        {rejectionReason ? (
          <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-950">
            {rejectionReason}
          </p>
        ) : null}
      </div>

      <ul className="space-y-2">
        {ACTIONABLE.map((step) => {
          const done = checklist[step] === true;
          return (
            <li
              key={step}
              className={cn(
                "flex min-h-14 items-center justify-between rounded-xl border px-4 py-3",
                done ? "border-teal/40 bg-teal-muted/40" : "border-border bg-surface",
              )}
            >
              <div>
                <p className="font-medium text-ink">{ONBOARDING_STEP_LABELS[step]}</p>
                <p className="text-xs text-ink-muted">{done ? "Complete" : "Needs attention"}</p>
              </div>
              {step === "documents" ? (
                <Link href={routes.cleanerDocuments} className="text-sm font-medium text-teal">
                  Open
                </Link>
              ) : step === "availability" ? (
                <Link href={routes.cleanerAvailability} className="text-sm font-medium text-teal">
                  Open
                </Link>
              ) : step === "profile" || step === "personal" ? (
                <Link href={routes.cleanerProfile} className="text-sm font-medium text-teal">
                  Open
                </Link>
              ) : step === "services" || step === "service_areas" ? (
                <Link href={routes.cleanerSettings} className="text-sm font-medium text-teal">
                  Open
                </Link>
              ) : step === "payout" ? (
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={pending}
                  onClick={() => void markStep("payout")}
                >
                  Mark later
                </Button>
              ) : step === "agreements" ? (
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={pending}
                  onClick={() => void markStep("agreements", { acceptAgreements: true })}
                >
                  Accept
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={pending || done}
                  onClick={() => void markStep(step)}
                >
                  {done ? "Done" : "Mark done"}
                </Button>
              )}
            </li>
          );
        })}
      </ul>

      {status !== "APPROVED" && status !== "SUBMITTED" && status !== "UNDER_REVIEW" ? (
        <Button
          className="w-full"
          disabled={pending || progress.percent < 60}
          onClick={() => void submit()}
        >
          Submit for review
        </Button>
      ) : null}

      {message ? <p className="text-sm text-ink-muted">{message}</p> : null}
      <p className="text-xs text-ink-subtle">
        Approval means MaidLinx ops reviewed your application. It is not a background check claim.
      </p>
    </div>
  );
}
