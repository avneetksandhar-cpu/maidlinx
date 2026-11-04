import { Suspense } from "react";
import { CommercialChooseTeamLoader } from "@/components/commercial/commercial-choose-team-loader";
import {
  proposalToTeamCard,
  type TeamCardModel,
} from "@/components/commercial/commercial-choose-team";
import { listProposalsForSite } from "@/lib/commercial/proposals";
import { getCustomerBookings } from "@/lib/dashboard/bookings";
import { getSavedAddressById, listSavedAddresses } from "@/lib/dashboard/addresses";
import { requireCustomerSession } from "@/lib/dashboard/session";

export const metadata = {
  title: "Choose a cleaning team",
};

async function TeamsContent({
  searchParams,
}: {
  searchParams: Promise<{ site?: string }>;
}) {
  const { profile, email } = await requireCustomerSession();
  const params = await searchParams;

  const sites = await listSavedAddresses(profile.id).catch(() => []);
  const siteId = params.site?.trim() || sites[0]?.id || null;
  const site = siteId
    ? (await getSavedAddressById(profile.id, siteId).catch(() => null)) ??
      sites.find((s) => s.id === siteId) ??
      null
    : null;

  let teams: TeamCardModel[] = [];
  if (site) {
    const proposals = await listProposalsForSite({
      siteAddressId: site.id,
      userId: profile.id,
    }).catch(() => []);
    teams = proposals
      .filter((p) =>
        ["sent", "awaiting_approval", "approved"].includes(p.status),
      )
      .map(proposalToTeamCard);
  }

  const upcoming = await getCustomerBookings(profile.id, email, "upcoming").catch(
    () => [],
  );
  const line1 = (site?.addressLine1 ?? "").trim().toLowerCase();
  const jobTeams: TeamCardModel[] = upcoming
    .filter((b) => {
      if (!line1) return false;
      return (b.addressLine1 ?? "").trim().toLowerCase() === line1;
    })
    .filter((b) => Boolean(b.professionalName?.trim()) || b.totalCents > 0)
    .map((b) => ({
      proposalId: `booking:${b.id}`,
      providerName: b.professionalName?.trim() || "Assigned crew",
      windowLabel:
        b.arrivalWindowStart && b.arrivalWindowEnd
          ? `${b.arrivalWindowStart}–${b.arrivalWindowEnd}`
          : null,
      visitCents: b.totalCents,
      frequency: "one_time",
      billingCadence: "per_visit",
      status: b.status,
    }));

  return (
    <CommercialChooseTeamLoader
      initialTeams={teams}
      initialJobTeams={jobTeams}
      initialSiteLabel={site?.label ?? null}
      initialSiteId={site?.id ?? null}
    />
  );
}

export default function CommercialBookTeamsPage({
  searchParams,
}: {
  searchParams: Promise<{ site?: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-[390px] animate-pulse space-y-4">
          <div className="h-8 w-56 rounded-lg bg-[var(--ml-dark-surface)]" />
          <div className="h-28 rounded-2xl bg-[var(--ml-dark-surface)]" />
        </div>
      }
    >
      <TeamsContent searchParams={searchParams} />
    </Suspense>
  );
}
