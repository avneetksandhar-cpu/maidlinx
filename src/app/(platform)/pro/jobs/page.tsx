import { Suspense } from "react";
import { AssignedJobCard, AvailableJobCard } from "@/components/pro/job-card";
import { JobsTabs, type JobsTab } from "@/components/pro/jobs-tabs";
import { ProEmptyState } from "@/components/pro/pro-empty-state";
import {
  getAvailableJobs,
  getTodaySchedule,
  getUpcomingJobs,
} from "@/lib/pro/dashboard/jobs";
import { requireProfessionalSession } from "@/lib/pro/dashboard/session";
import { routes } from "@/config/site";

export const metadata = {
  title: "My jobs",
};

interface ProJobsPageProps {
  searchParams: Promise<{ tab?: string }>;
}

function parseTab(value: string | undefined): JobsTab {
  if (value === "upcoming") return "upcoming";
  return "today";
}

async function JobsContent({ tab }: { tab: JobsTab }) {
  const { profile } = await requireProfessionalSession();

  const [today, available, upcoming] = await Promise.all([
    getTodaySchedule(profile.id),
    getAvailableJobs(profile.id),
    getUpcomingJobs(profile.id),
  ]);

  const counts = {
    today: today.length + available.length,
    upcoming: upcoming.length,
  };

  if (tab === "upcoming") {
    if (upcoming.length === 0) {
      return (
        <>
          <h1 className="mb-4 text-2xl font-semibold tracking-tight text-[var(--ml-dark-ink)]">
            My jobs
          </h1>
          <JobsTabs counts={counts} />
          <ProEmptyState
            title="No upcoming jobs"
            description="Jobs after today will list here once you accept or get assigned."
            actionLabel="View today"
            actionHref={`${routes.cleanerJobs}?tab=today`}
          />
        </>
      );
    }

    return (
      <>
        <h1 className="mb-4 text-2xl font-semibold tracking-tight text-[var(--ml-dark-ink)]">
          My jobs
        </h1>
        <JobsTabs counts={counts} />
        <div className="space-y-3">
          {upcoming.map((job) => (
            <AssignedJobCard key={job.id} job={job} />
          ))}
        </div>
      </>
    );
  }

  const hasAny = available.length > 0 || today.length > 0;

  return (
    <>
      <h1 className="mb-4 text-2xl font-semibold tracking-tight text-[var(--ml-dark-ink)]">
        My jobs
      </h1>
      <JobsTabs counts={counts} />

      {!hasAny ? (
        <ProEmptyState
          title="Nothing scheduled today"
          description="Open jobs and today’s accepted work show up here."
        />
      ) : (
        <div className="space-y-3">
          {available.map((job) => (
            <AvailableJobCard key={job.id} job={job} />
          ))}
          {today.map((job) => (
            <AssignedJobCard key={job.id} job={job} />
          ))}
        </div>
      )}
    </>
  );
}

export default async function ProJobsPage({ searchParams }: ProJobsPageProps) {
  const { tab: tabParam } = await searchParams;
  const tab = parseTab(tabParam);

  return (
    <div className="mx-auto max-w-lg px-4 py-5 sm:max-w-xl lg:max-w-2xl lg:px-8 lg:py-8">
      <Suspense
        fallback={
          <div className="h-64 animate-pulse rounded-2xl bg-[var(--ml-dark-surface)]" />
        }
      >
        <JobsContent tab={tab} />
      </Suspense>
    </div>
  );
}
