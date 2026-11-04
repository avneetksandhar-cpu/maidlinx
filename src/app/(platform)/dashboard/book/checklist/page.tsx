import { Suspense } from "react";
import { CommercialChecklist } from "@/components/commercial/commercial-checklist";
import { getProposalForBuyer } from "@/lib/commercial/proposals";
import { getScopeForSite } from "@/lib/commercial/scopes";
import { getSavedAddressById } from "@/lib/dashboard/addresses";
import { requireCustomerSession } from "@/lib/dashboard/session";

export const metadata = {
  title: "Cleaning checklist",
};

async function ChecklistContent({
  searchParams,
}: {
  searchParams: Promise<{ proposal?: string; site?: string }>;
}) {
  const { profile } = await requireCustomerSession();
  const params = await searchParams;
  const proposalId = params.proposal?.trim() || null;

  let areas: string[] = [];
  let inclusions: string | null = null;
  let exclusions: string | null = null;
  let siteLabel: string | null = null;
  let siteId = params.site?.trim() || null;

  if (proposalId && !proposalId.startsWith("booking:")) {
    const proposal = await getProposalForBuyer(proposalId, profile.id).catch(
      () => null,
    );
    if (proposal) {
      siteId = proposal.siteAddressId;
      inclusions = proposal.inclusions;
      exclusions = proposal.exclusions;
      const snapAreas = proposal.scopeSnapshot?.areas;
      if (Array.isArray(snapAreas)) {
        areas = snapAreas.map(String);
      }
    }
  }

  if (siteId) {
    const site = await getSavedAddressById(profile.id, siteId).catch(() => null);
    siteLabel = site?.label ?? null;
    if (areas.length === 0) {
      const scope = await getScopeForSite({
        siteAddressId: siteId,
        userId: profile.id,
      }).catch(() => null);
      if (scope) areas = scope.areas;
    }
  }

  return (
    <CommercialChecklist
      areas={areas}
      inclusions={inclusions}
      exclusions={exclusions}
      proposalId={proposalId}
      siteLabel={siteLabel}
    />
  );
}

export default function CommercialBookChecklistPage({
  searchParams,
}: {
  searchParams: Promise<{ proposal?: string; site?: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-[390px] animate-pulse space-y-4">
          <div className="h-8 w-48 rounded-lg bg-[var(--ml-dark-surface)]" />
          <div className="h-40 rounded-2xl bg-[var(--ml-dark-surface)]" />
        </div>
      }
    >
      <ChecklistContent searchParams={searchParams} />
    </Suspense>
  );
}
