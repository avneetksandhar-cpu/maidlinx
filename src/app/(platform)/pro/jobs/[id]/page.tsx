import { Suspense } from "react";
import { JobDetailPanel } from "@/components/pro/job-detail-panel";
import { ProHeader } from "@/components/pro/pro-header";
import { getJobForProfessional, getJobPhotos } from "@/lib/pro/dashboard/jobs";
import { requireProfessionalSession } from "@/lib/pro/dashboard/session";
import { notFound } from "next/navigation";
import Link from "next/link";
import { routes } from "@/config/site";

export const metadata = {
  title: "Job Details",
};

interface JobPageProps {
  params: Promise<{ id: string }>;
}

async function JobDetailContent({ id }: { id: string }) {
  const { profile } = await requireProfessionalSession();

  const job = await getJobForProfessional(id, profile.id);
  if (!job) notFound();

  const photos = await getJobPhotos(id, profile.id);

  const backTab =
    job.status === "completed"
      ? "earnings"
      : new Date(job.scheduledAt).toDateString() === new Date().toDateString()
        ? "today"
        : "upcoming";

  return (
    <>
      <Link
        href={`${routes.cleanerJobs}?tab=${backTab}`}
        className="mb-4 inline-flex text-sm font-medium text-teal hover:text-accent-hover"
      >
        ← Back to jobs
      </Link>
      <ProHeader
        title="Job details"
        description={
          job.status === "completed"
            ? "Completed job summary."
            : "Advance status step by step, finish the checklist, then complete."
        }
      />
      <JobDetailPanel job={job} photos={photos} />
    </>
  );
}

export default async function ProJobDetailPage({ params }: JobPageProps) {
  const { id } = await params;

  return (
    <div className="mx-auto max-w-lg px-4 py-5 sm:max-w-xl lg:max-w-2xl lg:px-8 lg:py-8">
      <Suspense fallback={<div className="h-96 animate-pulse rounded-xl bg-border" />}>
        <JobDetailContent id={id} />
      </Suspense>
    </div>
  );
}
