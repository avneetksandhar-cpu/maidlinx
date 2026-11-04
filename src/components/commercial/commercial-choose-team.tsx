"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Check, Clock } from "lucide-react";
import {
  CommercialCtaButton,
} from "@/components/commercial/commercial-book-chrome";
import {
  frequencyShortLabel,
  isCommercialBookReady,
  readCommercialBookDraft,
  writeCommercialBookDraft,
  type CommercialBookDraft,
} from "@/lib/commercial/book-draft";
import { formatCents } from "@/lib/commercial/pricing-display";
import type { CommercialProposal } from "@/lib/commercial/types";
import { routes } from "@/config/site";
import { cn } from "@/lib/utils";

export interface TeamCardModel {
  proposalId: string;
  providerName: string;
  windowLabel: string | null;
  visitCents: number;
  frequency: string;
  billingCadence: string;
  status: string;
}

interface CommercialChooseTeamProps {
  teams: TeamCardModel[];
  /** Fallback when proposals table empty but real assigned jobs exist for the site. */
  jobTeams?: TeamCardModel[];
  siteLabel?: string | null;
}

/**
 * Screen B — Choose a cleaning team from real proposals / assigned jobs only.
 * Empty → honest empty state (no invented providers).
 */
export function CommercialChooseTeam({
  teams,
  jobTeams = [],
  siteLabel,
}: CommercialChooseTeamProps) {
  const router = useRouter();
  const [draft, setDraft] = useState<CommercialBookDraft | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    const d = readCommercialBookDraft();
    if (!isCommercialBookReady(d)) {
      router.replace(routes.dashboardBook);
      return;
    }
    setDraft(d);
    setSelectedId(d.proposalId);
  }, [router]);

  const cards = useMemo(() => {
    const merged = [...teams];
    for (const j of jobTeams) {
      if (!merged.some((t) => t.proposalId === j.proposalId)) merged.push(j);
    }
    return merged;
  }, [teams, jobTeams]);

  function select(id: string) {
    setSelectedId(id);
    writeCommercialBookDraft({ proposalId: id });
  }

  const subtitle = [
    draft?.frequency ? frequencyShortLabel(draft.frequency) : null,
    draft?.siteLabel ?? siteLabel,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="mx-auto w-full max-w-[390px] space-y-5 lg:max-w-[430px]">
      <header className="space-y-2">
        <Link
          href={routes.dashboardBook}
          className="inline-flex text-sm font-semibold text-[#04CED2]"
        >
          ← Back
        </Link>
        <h1 className="text-[1.75rem] font-bold tracking-tight text-white">
          Choose a cleaning team
        </h1>
        {subtitle ? (
          <p className="text-sm text-[var(--ml-dark-ink-muted)]">{subtitle}</p>
        ) : null}
      </header>

      {cards.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/15 bg-[var(--ml-dark-surface)] px-4 py-8 text-center">
          <p className="text-sm font-semibold text-white">No eligible teams yet</p>
          <p className="mt-1.5 text-sm text-[var(--ml-dark-ink-muted)]">
            BOOKABLE supply is empty for this site — we only show real proposals and
            assigned crews, never sample providers. Request quotes from Sites or wait
            for a commercial provider to send a proposal.
          </p>
          <div className="mt-4 flex flex-col gap-2">
            {draft?.siteId ? (
              <Link
                href={routes.dashboardSiteQuotes(draft.siteId)}
                className="inline-flex h-12 items-center justify-center rounded-2xl bg-[#04CED2] px-5 text-sm font-semibold text-[#01193D]"
              >
                Request quotes
              </Link>
            ) : null}
            <Link
              href={routes.dashboardSites}
              className="inline-flex h-12 items-center justify-center rounded-2xl border border-white/30 px-5 text-sm font-semibold text-white"
            >
              Manage sites
            </Link>
          </div>
        </div>
      ) : (
        <ul className="space-y-3">
          {cards.map((team) => {
            const selected = selectedId === team.proposalId;
            return (
              <li key={team.proposalId}>
                <button
                  type="button"
                  onClick={() => select(team.proposalId)}
                  className={cn(
                    "flex w-full items-start gap-3 rounded-2xl border px-4 py-4 text-left transition-colors",
                    selected
                      ? "border-[#04CED2] bg-[var(--ml-dark-surface)]"
                      : "border-white/15 bg-[var(--ml-dark-surface)] hover:border-white/30",
                  )}
                >
                  <span
                    className={cn(
                      "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border",
                      selected
                        ? "border-[#04CED2] bg-[#04CED2] text-[#01193D]"
                        : "border-white/35 text-transparent",
                    )}
                    aria-hidden
                  >
                    <Check className="size-3.5" strokeWidth={3} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[16px] font-semibold text-white">
                      {team.providerName}
                    </span>
                    {team.windowLabel ? (
                      <span className="mt-1 flex items-center gap-1.5 text-sm text-white/60">
                        <Clock className="size-3.5 shrink-0" aria-hidden />
                        {team.windowLabel}
                      </span>
                    ) : (
                      <span className="mt-1 block text-sm text-white/55">
                        Window TBD · {team.status.replaceAll("_", " ")}
                      </span>
                    )}
                    <span className="mt-2 block text-[15px] font-semibold text-white">
                      {team.visitCents > 0
                        ? `${formatCents(team.visitCents)} / visit`
                        : "Quote pending"}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {cards.length > 0 ? (
        <>
          <Link
            href={
              selectedId
                ? `${routes.dashboardBookChecklist}?proposal=${encodeURIComponent(selectedId)}`
                : routes.dashboardBookChecklist
            }
            className="inline-flex text-[15px] font-semibold text-white underline underline-offset-4"
          >
            View cleaning checklist
          </Link>
          <CommercialCtaButton
            href={
              selectedId
                ? `${routes.dashboardBookReview}?proposal=${encodeURIComponent(selectedId)}`
                : undefined
            }
            disabled={!selectedId}
          >
            Review booking
          </CommercialCtaButton>
        </>
      ) : null}
    </div>
  );
}

export function proposalToTeamCard(p: CommercialProposal): TeamCardModel {
  const snap = p.scopeSnapshot ?? {};
  const windowLabel =
    typeof snap.serviceWindow === "string" && snap.serviceWindow.trim()
      ? snap.serviceWindow.trim()
      : null;
  return {
    proposalId: p.id,
    providerName: p.providerName?.trim() || "Commercial provider",
    windowLabel,
    visitCents: p.clientPriceCents,
    frequency: p.frequency,
    billingCadence: p.billingCadence,
    status: p.status,
  };
}
