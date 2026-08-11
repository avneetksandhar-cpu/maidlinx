import { Suspense } from "react";
import {
  AssignedJobCard,
  AvailableJobCard,
} from "@/components/pro/job-card";
import { JobsTabs, type JobsTab } from "@/components/pro/jobs-tabs";
import { ProHeader } from "@/components/pro/pro-header";
import { ProEmptyState } from "@/components/pro/pro-empty-state";
import { EarningsPanel } from "@/components/pro/earnings-panel";
import {
  getAvailableJobs,
  getTodaySchedule,
  getUpcomingJobs,
} from "@/lib/pro/dashboard/jobs";
import { getEarningsHistory, getEarningsSummary } from "@/lib/pro/dashboard/earnings";
import { getCleanerCapabilities } from "@/lib/pro/dashboard/capabilities";
import { requireProfessionalSession } from "@/lib/pro/dashboard/session";
import { routes } from "@/config/site";

export const metadata = {
  title: "Cleaner dashboard",
};

interface ProJobsPageProps {
  searchParams: Promise<{ tab?: string }>;
}

function parseTab(value: string | undefined): JobsTab {
  if (value === "available" || value === "upcoming" || value === "earnings") return value;
  return "today";
}

async function JobsContent({ tab }: { tab: JobsTab }) {
  const { profile } = await requireProfessionalSession();

  const [today, available, upcoming, summary, history, capabilities] = await Promise.all([
    getTodaySchedule(profile.id),
    getAvailableJobs(profile.id),
    getUpcomingJobs(profile.id),
    getEarningsSummary(profile.id),
    getEarningsHistory(profile.id),
    getCleanerCapabilities(profile.id),
  ]);

  const counts = {
    today: today.length,
    available: available.length,
    upcoming: upcoming.length,
  };

  const emptyStates: Record<
    Exclude<JobsTab, "earnings">,
    { title: string; description: string }
  > = {
    today: {
      title: "Nothing scheduled today",
      description: "Accepted jobs for today show up here with exact addresses.",
    },
    available: {
      title: "No jobs available",
      description:
        "Open jobs matching your services and zones appear here. Exact street addresses stay hidden until you accept.",
    },
    upcoming: {
      title: "No upcoming jobs",
      description: "Jobs after today will list here once you accept or get assigned.",
    },
  };

  return (
    <>
      <ProHeader
        title="MaidLinx Cleaner"
        description="Today’s work, open jobs, upcoming schedule, and earnings."
      />
      <JobsTabs counts={counts} />

      {tab === "earnings" ? (
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-surface px-4 py-3 text-sm">
            <p className="font-medium text-navy">Payout status</p>
            <p className="mt-1 text-ink-muted">
              {capabilities?.payoutStatus === "ready"
                ? "Stripe Connect linked — payouts enabled."
                : "Payouts pending — connect Stripe via support to receive transfers."}
            </p>
          </div>
          <EarningsPanel summary={summary} history={history} />
        </div>
      ) : (
        (() => {
          const jobs =
            tab === "today" ? today : tab === "upcoming" ? upcoming : available;
          if (jobs.length === 0) {
            return (
              <ProEmptyState
                title={emptyStates[tab].title}
                description={emptyStates[tab].description}
                actionLabel={tab !== "available" ? "Browse available" : undefined}
                actionHref={
                  tab !== "available" ? `${routes.cleanerJobs}?tab=available` : undefined
                }
              />
            );
          }
          return (
            <div className="space-y-3">
              {tab === "available"
                ? jobs.map((job) => <AvailableJobCard key={job.id} job={job} />)
                : jobs.map((job) => <AssignedJobCard key={job.id} job={job} />)}
            </div>
          );
        })()
      )}
    </>
  );
}

export default async function ProJobsPage({ searchParams }: ProJobsPageProps) {
  const { tab: tabParam } = await searchParams;
  const tab = parseTab(tabParam);

  return (
    <div className="mx-auto max-w-lg px-4 py-5 sm:max-w-xl lg:max-w-2xl lg:px-8 lg:py-8">
      <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-border" />}>
        <JobsContent tab={tab} />
      </Suspense>
    </div>
  );
}
