"use client";

import { useCallback, useEffect, useState } from "react";
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
  publicPath?: boolean;
}

/**
 * Resolves draft.siteId client-side, then loads real proposals for that site.
 */
export function CommercialChooseTeamLoader({
  initialTeams,
  initialJobTeams,
  initialSiteLabel,
  initialSiteId,
  publicPath = false,
}: CommercialChooseTeamLoaderProps) {
  const router = useRouter();
  const [teams, setTeams] = useState(initialTeams);
  const [jobTeams] = useState(initialJobTeams);
  const [siteLabel, setSiteLabel] = useState(initialSiteLabel);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  const load = useCallback(async () => {
    const draft = readCommercialBookDraft();
    if (!isCommercialBookReady(draft)) {
      router.replace(
        publicPath ? routes.bookCommercialProperty : routes.dashboardBook,
      );
      return;
    }

    setSiteLabel(draft.siteLabel);
    const siteId = draft.siteId;

    if (!siteId) {
      // Address-only draft (no saved site yet) — cannot query proposals; honest zero.
      setTeams([]);
      setLoadError(null);
      setLoading(false);
      return;
    }

    if (siteId === initialSiteId && retryKey === 0) {
      setTeams(initialTeams);
      setLoadError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch(
        `/api/commercial/proposals?siteAddressId=${encodeURIComponent(siteId)}`,
      );
      if (!res.ok) {
        throw new Error("Unable to load cleaning teams. Please retry.");
      }
      const json = (await res.json().catch(() => ({}))) as {
        data?: { proposals?: CommercialProposal[] };
        error?: string;
      };
      const proposals = json.data?.proposals ?? [];
      setTeams(
        proposals
          .filter((p) =>
            ["sent", "awaiting_approval", "approved"].includes(p.status),
          )
          .map(proposalToTeamCard),
      );
    } catch (err) {
      setTeams([]);
      setLoadError(
        err instanceof Error ? err.message : "Unable to load cleaning teams.",
      );
    } finally {
      setLoading(false);
    }
  }, [router, publicPath, initialSiteId, initialTeams, retryKey]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <CommercialChooseTeam
      teams={teams}
      jobTeams={jobTeams}
      siteLabel={siteLabel}
      loading={loading}
      loadError={loadError}
      onRetry={() => setRetryKey((k) => k + 1)}
      publicPath={publicPath}
    />
  );
}
