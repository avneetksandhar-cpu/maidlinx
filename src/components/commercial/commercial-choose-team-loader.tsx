"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CommercialChooseTeam,
  proposalToTeamCard,
  type TeamCardModel,
} from "@/components/commercial/commercial-choose-team";
import {
  isCommercialBookReady,
  readCommercialBookDraft,
} from "@/lib/commercial/book-draft";
import type { CommercialProposal } from "@/lib/commercial/types";
import { routes } from "@/config/site";

interface CommercialChooseTeamLoaderProps {
  /** Server-prefetched teams for default / first site (may be empty). */
  initialTeams: TeamCardModel[];
  initialJobTeams: TeamCardModel[];
  initialSiteLabel: string | null;
  initialSiteId: string | null;
}

/**
 * Resolves draft.siteId client-side, then loads real proposals for that site.
 */
export function CommercialChooseTeamLoader({
  initialTeams,
  initialJobTeams,
  initialSiteLabel,
  initialSiteId,
}: CommercialChooseTeamLoaderProps) {
  const router = useRouter();
  const [teams, setTeams] = useState(initialTeams);
  const [jobTeams] = useState(initialJobTeams);
  const [siteLabel, setSiteLabel] = useState(initialSiteLabel);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const draft = readCommercialBookDraft();
    if (!isCommercialBookReady(draft)) {
      router.replace(routes.dashboardBook);
      return;
    }

    const siteId = draft.siteId;
    setSiteLabel(draft.siteLabel);
    if (!siteId) {
      setLoading(false);
      return;
    }

    if (siteId === initialSiteId) {
      setTeams(initialTeams);
      setLoading(false);
      return;
    }

    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch(
          `/api/commercial/proposals?siteAddressId=${encodeURIComponent(siteId)}`,
        );
        const json = (await res.json().catch(() => ({}))) as {
          data?: { proposals?: CommercialProposal[] };
        };
        if (cancelled) return;
        const proposals = json.data?.proposals ?? [];
        setTeams(
          proposals
            .filter((p) =>
              ["sent", "awaiting_approval", "approved"].includes(p.status),
            )
            .map(proposalToTeamCard),
        );
      } catch {
        if (!cancelled) setTeams([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router, initialSiteId, initialTeams]);

  if (loading) {
    return (
      <div className="mx-auto max-w-[390px] animate-pulse space-y-4">
        <div className="h-8 w-56 rounded-lg bg-[var(--ml-dark-surface)]" />
        <div className="h-28 rounded-2xl bg-[var(--ml-dark-surface)]" />
      </div>
    );
  }

  return (
    <CommercialChooseTeam
      teams={teams}
      jobTeams={jobTeams}
      siteLabel={siteLabel}
    />
  );
}
