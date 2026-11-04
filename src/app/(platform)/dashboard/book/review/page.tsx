import { Suspense } from "react";
import { CommercialBookReview } from "@/components/commercial/commercial-book-review";
import { getProposalForBuyer } from "@/lib/commercial/proposals";
import { getScopeForSite } from "@/lib/commercial/scopes";
import { getSavedAddressById } from "@/lib/dashboard/addresses";
import { requireCustomerSession } from "@/lib/dashboard/session";

export const metadata = {
  title: "Review booking",
};

async function ReviewContent({
  searchParams,
}: {
  searchParams: Promise<{ proposal?: string }>;
}) {
  const { profile } = await requireCustomerSession();
  const params = await searchParams;
  const proposalId = params.proposal?.trim() || null;

  if (!proposalId) {
    return (
      <CommercialBookReview
        proposal={null}
        siteLabel={null}
        serviceLabel={null}
        areas={[]}
        emptyReason="Select a cleaning team first, then review."
      />
    );
  }

  // Booking-backed "team" cards cannot be approved as commercial proposals.
  if (proposalId.startsWith("booking:")) {
    return (
      <CommercialBookReview
        proposal={null}
        siteLabel={null}
        serviceLabel={null}
        areas={[]}
        emptyReason="This team is from an existing job. Open Jobs to manage it — new commercial confirmation requires a real proposal."
      />
    );
  }

  const proposal = await getProposalForBuyer(proposalId, profile.id).catch(
    () => null,
  );
  if (!proposal) {
    return (
      <CommercialBookReview
        proposal={null}
        siteLabel={null}
        serviceLabel={null}
        areas={[]}
        emptyReason="Proposal not found or not available for your account."
      />
    );
  }

  const site = await getSavedAddressById(
    profile.id,
    proposal.siteAddressId,
  ).catch(() => null);
  const scope = await getScopeForSite({
    siteAddressId: proposal.siteAddressId,
    userId: profile.id,
  }).catch(() => null);

  const snapAreas = proposal.scopeSnapshot?.areas;
  const areas = Array.isArray(snapAreas)
    ? snapAreas.map(String)
    : (scope?.areas ?? []);

  const serviceLabel =
    typeof proposal.scopeSnapshot?.serviceLabel === "string"
      ? proposal.scopeSnapshot.serviceLabel
      : typeof proposal.scopeSnapshot?.summaryPlain === "string"
        ? proposal.scopeSnapshot.summaryPlain
        : scope?.summaryPlain ?? null;

  return (
    <CommercialBookReview
      proposal={proposal}
      siteLabel={site?.label ?? null}
      serviceLabel={serviceLabel}
      areas={areas}
    />
  );
}

export default function CommercialBookReviewPage({
  searchParams,
}: {
  searchParams: Promise<{ proposal?: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-[390px] animate-pulse space-y-4">
          <div className="h-8 w-40 rounded-lg bg-[var(--ml-dark-surface)]" />
          <div className="h-48 rounded-2xl bg-[var(--ml-dark-surface)]" />
        </div>
      }
    >
      <ReviewContent searchParams={searchParams} />
    </Suspense>
  );
}
