import { Suspense } from "react";
import Link from "next/link";
import { MoreHorizontal } from "lucide-react";
import { JobDetailPanel } from "@/components/pro/job-detail-panel";
import { AppHeader } from "@/components/mobile/app-header";
import { getJobForProfessional, getJobPhotos } from "@/lib/pro/dashboard/jobs";
import { requireProfessionalSession } from "@/lib/pro/dashboard/session";
import { normalizeBookingStatus } from "@/lib/bookings/status";
import { notFound } from "next/navigation";
import { routes } from "@/config/site";

export const metadata = {
  title: "Job details",
};

interface JobPageProps {
  params: Promise<{ id: string }>;
}

async function JobDetailContent({ id }: { id: string }) {
  const { profile } = await requireProfessionalSession();

  const job = await getJobForProfessional(id, profile.id);
  if (!job) notFound();

  const photos = await getJobPhotos(id, profile.id);
  const status = normalizeBookingStatus(job.status);
  const backTab =
    status === "completed"
      ? "today"
      : new Date(job.scheduledAt).toDateString() === new Date().toDateString()
        ? "today"
        : "upcoming";
  const backHref = `${routes.cleanerJobs}?tab=${backTab}`;

  return (
    <>
      <div className="lg:hidden">
        <AppHeader
          homeHref={routes.cleanerDashboard}
          backHref={backHref}
          logoVariant="mark"
          trailing={
            <Link
              href={routes.cleanerProfile}
              aria-label="More"
              className="inline-flex size-11 items-center justify-center rounded-xl text-[var(--ml-app-header-ink)] transition-colors hover:bg-black/10"
            >
              <MoreHorizontal className="size-6" strokeWidth={2.25} aria-hidden />
            </Link>
          }
        />
      </div>
      <div className="mx-auto max-w-lg px-4 py-5 sm:max-w-xl lg:max-w-2xl lg:px-8 lg:py-8">
        <p className="mb-4 hidden text-sm font-medium text-[var(--ml-dark-mint)] lg:block">
          <Link href={backHref}>← Back to jobs</Link>
        </p>
        <h1 className="mb-5 text-xl font-semibold text-[var(--ml-dark-ink)] lg:text-2xl">
          {status === "in_progress" ? "Job progress" : "Job details"}
        </h1>
        <JobDetailPanel job={job} photos={photos} />
      </div>
    </>
  );
}

export default async function ProJobDetailPage({ params }: JobPageProps) {
  const { id } = await params;

  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-lg px-4 py-5">
          <div className="h-96 animate-pulse rounded-2xl bg-[var(--ml-dark-surface)]" />
        </div>
      }
    >
      <JobDetailContent id={id} />
    </Suspense>
  );
}
