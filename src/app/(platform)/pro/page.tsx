import Link from "next/link";
import { Suspense } from "react";
import { OnlineToggle } from "@/components/pro/online-toggle";
import { ProHeader } from "@/components/pro/pro-header";
import { AssignedJobCard } from "@/components/pro/job-card";
import { routes } from "@/config/site";
import {
  canAccessProJobs,
  checklistProgress,
  publicCleanerDisplayName,
  requiresOnboardingRedirect,
} from "@/lib/cleaners/onboarding";
import { getCleanerOnboarding } from "@/lib/cleaners/onboarding-store";
import { getEarningsSummary } from "@/lib/pro/dashboard/earnings";
import { getTodaySchedule, getUpcomingJobs } from "@/lib/pro/dashboard/jobs";
import { formatEarnings, getServiceLabel } from "@/lib/pro/dashboard/display";
import { requireProfessionalSession } from "@/lib/pro/dashboard/session";
import { redirect } from "next/navigation";

export const metadata = {
  title: "MaidLinx Pro",
};

async function HomeContent() {
  const { profile } = await requireProfessionalSession();
  const onboarding = await getCleanerOnboarding(profile.professionalId);

  if (onboarding && requiresOnboardingRedirect(onboarding.onboardingStatus)) {
    redirect(routes.cleanerOnboarding);
  }

  const [today, upcoming, summary] = await Promise.all([
    getTodaySchedule(profile.id),
    getUpcomingJobs(profile.id),
    getEarningsSummary(profile.id),
  ]);

  const greeting = publicCleanerDisplayName(profile.firstName, profile.lastName);
  const canWork = canAccessProJobs(profile.onboardingStatus);
  const progress = checklistProgress(profile.onboardingChecklist);

  return (
    <>
      <ProHeader
        title={`Hi, ${greeting}`}
        description="Your day on MaidLinx — go online, take jobs, get paid."
      />

      <div className="mb-5">
        <OnlineToggle
          initialOnline={profile.isOnline}
          canGoOnline={profile.onboardingStatus === "APPROVED"}
        />
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-border bg-surface px-4 py-4">
          <p className="text-sm text-ink-muted">Today&apos;s jobs</p>
          <p className="mt-1 font-display text-3xl font-semibold text-navy">{today.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface px-4 py-4">
          <p className="text-sm text-ink-muted">Earned</p>
          <p className="mt-1 font-display text-2xl font-semibold text-teal">
            {formatEarnings(summary.totalEarnedCents, summary.currency)}
          </p>
          <p className="text-xs text-ink-subtle">
            Pending {formatEarnings(summary.pendingCents, summary.currency)}
          </p>
        </div>
      </div>

      {!canWork ? (
        <Link
          href={routes.cleanerOnboarding}
          className="mb-6 flex min-h-14 items-center justify-between rounded-xl border border-teal/30 bg-teal-muted/50 px-4 py-3"
        >
          <div>
            <p className="font-medium text-navy">Finish onboarding</p>
            <p className="text-sm text-ink-muted">{progress.percent}% complete</p>
          </div>
          <span className="text-teal">→</span>
        </Link>
      ) : null}

      <section className="mb-8 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-navy">Today</h2>
          <Link href={`${routes.cleanerJobs}?tab=today`} className="text-sm font-medium text-teal">
            All jobs
          </Link>
        </div>
        {today.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-ink-muted">
            No jobs on the board for today.
          </p>
        ) : (
          today.slice(0, 3).map((job) => <AssignedJobCard key={job.id} job={job} />)
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-lg font-semibold text-navy">Upcoming</h2>
        {upcoming.length === 0 ? (
          <p className="text-sm text-ink-muted">Nothing scheduled yet.</p>
        ) : (
          upcoming.slice(0, 4).map((job) => (
            <Link
              key={job.id}
              href={routes.cleanerJob(job.id)}
              className="flex min-h-14 items-center justify-between rounded-xl border border-border bg-surface px-4 py-3"
            >
              <div>
                <p className="font-medium text-ink">{getServiceLabel(job.serviceType)}</p>
                <p className="text-sm text-ink-muted">
                  {[job.addressCity, job.addressState].filter(Boolean).join(", ")}
                </p>
              </div>
              <span className="text-teal">→</span>
            </Link>
          ))
        )}
      </section>
    </>
  );
}

export default function ProHomePage() {
  return (
    <div className="mx-auto max-w-lg px-4 py-5 sm:max-w-xl lg:max-w-2xl lg:px-8 lg:py-8">
      <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-border" />}>
        <HomeContent />
      </Suspense>
    </div>
  );
}
