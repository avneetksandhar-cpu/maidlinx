import { CommercialChooseTeamLoader } from "@/components/commercial/commercial-choose-team-loader";

export const metadata = {
  title: "Choose a cleaning team",
  robots: { index: false, follow: false },
};

/**
 * Public team selection — loads real proposals when draft has a siteId (after sign-in
 * / saved site). Otherwise shows honest zero + Try another time / Request a quote.
 */
export default function CommercialTeamsPage() {
  return (
    <CommercialChooseTeamLoader
      initialTeams={[]}
      initialJobTeams={[]}
      initialSiteLabel={null}
      initialSiteId={null}
      publicPath
    />
  );
}
