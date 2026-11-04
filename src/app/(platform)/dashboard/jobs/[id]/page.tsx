import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ServiceOrderCard } from "@/components/business/service-order-card";
import { getBookingForCustomer } from "@/lib/dashboard/bookings";
import { listSavedAddresses } from "@/lib/dashboard/addresses";
import { requireCustomerSession } from "@/lib/dashboard/session";

export const metadata = {
  title: "Service order",
};

async function JobContent({ jobId }: { jobId: string }) {
  const { profile, email } = await requireCustomerSession();
  const job = await getBookingForCustomer(jobId, profile.id, email);
  if (!job) notFound();

  const sites = await listSavedAddresses(profile.id).catch(() => []);
  const match = sites.find(
    (s) =>
      s.addressLine1.trim().toLowerCase() ===
      (job.addressLine1 ?? "").trim().toLowerCase(),
  );

  return <ServiceOrderCard job={job} siteLabel={match?.label} />;
}

export default async function JobServiceOrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-[430px] animate-pulse space-y-4">
          <div className="h-8 w-48 rounded-lg bg-[var(--ml-dark-surface)]" />
          <div className="h-40 rounded-2xl bg-[var(--ml-dark-surface)]" />
        </div>
      }
    >
      <JobContent jobId={id} />
    </Suspense>
  );
}
