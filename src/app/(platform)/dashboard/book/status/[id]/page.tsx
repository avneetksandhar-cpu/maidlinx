import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CommercialCrewStatus } from "@/components/commercial/commercial-crew-status";
import { getScopeForSite } from "@/lib/commercial/scopes";
import { isLiveLocationStatus } from "@/lib/bookings/status";
import { getBookingForCustomer } from "@/lib/dashboard/bookings";
import { listSavedAddresses } from "@/lib/dashboard/addresses";
import { requireCustomerSession } from "@/lib/dashboard/session";
import { routes } from "@/config/site";

export const metadata = {
  title: "Crew status",
};

async function StatusContent({ bookingId }: { bookingId: string }) {
  const { profile, email } = await requireCustomerSession();
  const job = await getBookingForCustomer(bookingId, profile.id, email);
  if (!job) notFound();

  const sites = await listSavedAddresses(profile.id).catch(() => []);
  const match = sites.find(
    (s) =>
      s.addressLine1.trim().toLowerCase() ===
      (job.addressLine1 ?? "").trim().toLowerCase(),
  );

  let entryHref: string | null = null;
  if (match) {
    const scope = await getScopeForSite({
      siteAddressId: match.id,
      userId: profile.id,
    }).catch(() => null);
    if (scope?.accessNotes?.trim()) {
      entryHref = routes.dashboardSiteScope(match.id);
    }
  }

  return (
    <CommercialCrewStatus
      job={job}
      siteLabel={match?.label ?? null}
      entryInstructionsHref={entryHref}
      showLiveMapEligible={
        Boolean(job.professionalProfileId) && isLiveLocationStatus(job.status)
      }
    />
  );
}

export default async function CommercialBookStatusPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-[390px] animate-pulse space-y-4">
          <div className="h-8 w-56 rounded-lg bg-[var(--ml-dark-surface)]" />
          <div className="aspect-[16/11] rounded-2xl bg-[var(--ml-dark-surface)]" />
        </div>
      }
    >
      <StatusContent bookingId={id} />
    </Suspense>
  );
}
