import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CommercialCrewStatus } from "@/components/commercial/commercial-crew-status";
import { isLiveLocationStatus } from "@/lib/bookings/status";
import {
  getVisitEntryInstructionsForRequester,
  parseVisitEntryInstructions,
} from "@/lib/commercial/entry-instructions";
import { getBookingForCustomer } from "@/lib/dashboard/bookings";
import { listSavedAddresses } from "@/lib/dashboard/addresses";
import { requireCustomerSession } from "@/lib/dashboard/session";

export const metadata = {
  title: "Booking confirmed",
};

async function StatusContent({ bookingId }: { bookingId: string }) {
  const { profile, email } = await requireCustomerSession();
  const job = await getBookingForCustomer(bookingId, profile.id, email);
  if (!job) notFound();

  const sites = await listSavedAddresses(profile.id).catch(() => []);
  const match =
    (job.addressId
      ? sites.find((s) => s.id === job.addressId)
      : null) ??
    sites.find(
      (s) =>
        s.addressLine1.trim().toLowerCase() ===
        (job.addressLine1 ?? "").trim().toLowerCase(),
    );

  const entryResult = await getVisitEntryInstructionsForRequester({
    bookingId,
    requesterUserId: profile.id,
    requesterRole: profile.role,
  }).catch(() => null);

  const entry =
    entryResult?.allowed
      ? entryResult.entry ??
        parseVisitEntryInstructions(job.bookingAnswers)
      : null;

  return (
    <div className="min-h-[70dvh] bg-[#01193D] px-4 py-6 text-white">
      <CommercialCrewStatus
        job={job}
        siteLabel={match?.label ?? null}
        initialEntry={entry}
        showLiveMapEligible={
          Boolean(job.professionalProfileId) && isLiveLocationStatus(job.status)
        }
      />
    </div>
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
        <div className="mx-auto max-w-[390px] animate-pulse space-y-4 bg-[#01193D] px-4 py-6">
          <div className="h-8 w-56 rounded-lg bg-[var(--ml-dark-surface)]" />
          <div className="aspect-[16/11] rounded-2xl bg-[var(--ml-dark-surface)]" />
          <p className="text-center text-sm text-white/60">
            Confirming your booking…
          </p>
        </div>
      }
    >
      <StatusContent bookingId={id} />
    </Suspense>
  );
}
