"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Check, Clock, RotateCcw } from "lucide-react";
import { CommercialCtaButton } from "@/components/commercial/commercial-book-chrome";
import {
  commercialDraftQuoteNotes,
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
  /** Real review count only — omit or 0 when no records. */
  reviewCount?: number | null;
  ratingAvg?: number | null;
}

interface CommercialChooseTeamProps {
  teams: TeamCardModel[];
  /** Fallback when proposals table empty but real assigned jobs exist for the site. */
  jobTeams?: TeamCardModel[];
  siteLabel?: string | null;
  loading?: boolean;
  loadError?: string | null;
  onRetry?: () => void;
  /** When true, use public commercial routes for back/quote (pre-auth intake). */
  publicPath?: boolean;
}

/**
 * Screen B — Choose a cleaning team from real proposals / assigned jobs only.
 * Mockup: turquoise selected outline + corner check, $/visit, checklist link,
 * Review booking above safe area. States: many / one (auto-select) / zero / retry.
 */
export function CommercialChooseTeam({
  teams,
  jobTeams = [],
  siteLabel,
  loading = false,
  loadError = null,
  onRetry,
  publicPath = false,
}: CommercialChooseTeamProps) {
  const router = useRouter();
  const [draft, setDraft] = useState<CommercialBookDraft | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const backHref = publicPath
    ? routes.bookCommercialTime
    : routes.dashboardBookTime;
  const hubHref = publicPath ? routes.home : routes.dashboardBook;
  const quoteHref = publicPath
    ? routes.bookCommercialQuote
    : routes.forBusinessQuote;

  useEffect(() => {
    const d = readCommercialBookDraft();
    if (!isCommercialBookReady(d)) {
      router.replace(publicPath ? routes.bookCommercialProperty : routes.dashboardBook);
      return;
    }
    setDraft(d);
    setSelectedId(d.proposalId);
  }, [router, publicPath]);

  const cards = useMemo(() => {
    const merged = [...teams];
    for (const j of jobTeams) {
      if (!merged.some((t) => t.proposalId === j.proposalId)) merged.push(j);
    }
    return merged;
  }, [teams, jobTeams]);

  // Auto-select when exactly one real team is available.
  useEffect(() => {
    if (loading || loadError || cards.length !== 1) return;
    const only = cards[0];
    if (!only) return;
    setSelectedId((prev) => {
      if (prev === only.proposalId) return prev;
      writeCommercialBookDraft({ proposalId: only.proposalId });
      return only.proposalId;
    });
  }, [cards, loading, loadError]);

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

  const checklistHref = (proposalId: string) => {
    const base = publicPath
      ? `${routes.dashboardBookChecklist}?proposal=${encodeURIComponent(proposalId)}`
      : `${routes.dashboardBookChecklist}?proposal=${encodeURIComponent(proposalId)}`;
    return base;
  };

  const reviewHref = selectedId
    ? `${routes.dashboardBookReview}?proposal=${encodeURIComponent(selectedId)}`
    : undefined;

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-[390px] space-y-5 pb-[calc(6.5rem+env(safe-area-inset-bottom))] lg:max-w-[430px]">
        <header className="space-y-2">
          <Link href={backHref} className="inline-flex text-sm font-semibold text-[#04CED2]">
            ← Back
          </Link>
          <h1 className="text-[1.75rem] font-bold tracking-tight text-white">
            Choose a cleaning team
          </h1>
          {subtitle ? (
            <p className="text-sm text-white/55">{subtitle}</p>
          ) : null}
        </header>
        <div className="animate-pulse space-y-3">
          <div className="h-28 rounded-2xl bg-[var(--ml-dark-surface,#102B49)]" />
          <div className="h-28 rounded-2xl bg-[var(--ml-dark-surface,#102B49)]" />
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="mx-auto w-full max-w-[390px] space-y-5 pb-[calc(6.5rem+env(safe-area-inset-bottom))] lg:max-w-[430px]">
        <header className="space-y-2">
          <Link href={backHref} className="inline-flex text-sm font-semibold text-[#04CED2]">
            ← Back
          </Link>
          <h1 className="text-[1.75rem] font-bold tracking-tight text-white">
            Choose a cleaning team
          </h1>
        </header>
        <div className="rounded-2xl border border-dashed border-white/15 bg-[var(--ml-dark-surface,#102B49)] px-4 py-8 text-center">
          <p className="text-sm font-semibold text-white">Couldn’t load teams</p>
          <p className="mt-1.5 text-sm text-white/55">{loadError}</p>
          {onRetry ? (
            <button
              type="button"
              onClick={onRetry}
              className="mt-4 inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#04CED2] px-5 text-sm font-semibold text-[#01193D]"
            >
              <RotateCcw className="size-4" aria-hidden />
              Retry
            </button>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[390px] space-y-5 pb-[calc(9.5rem+env(safe-area-inset-bottom))] lg:max-w-[430px] lg:pb-8">
      <header className="space-y-2">
        <Link href={backHref} className="inline-flex text-sm font-semibold text-[#04CED2]">
          ← Back
        </Link>
        <h1 className="text-[1.75rem] font-bold tracking-tight text-white">
          Choose a cleaning team
        </h1>
        {subtitle ? (
          <p className="text-sm text-white/55">{subtitle}</p>
        ) : null}
      </header>

      {cards.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/15 bg-[var(--ml-dark-surface,#102B49)] px-4 py-8 text-center">
          <p className="text-sm font-semibold text-white">No teams available for this request</p>
          <p className="mt-1.5 text-sm text-white/55">
            We only show real proposals and assigned crews — never sample providers.
            Try another time window, or request a quote with your property details saved.
          </p>
          <div className="mt-5 flex flex-col gap-2">
            <Link
              href={backHref}
              className="inline-flex h-12 items-center justify-center rounded-2xl bg-[#04CED2] px-5 text-sm font-semibold text-[#01193D]"
            >
              Try another time
            </Link>
            <Link
              href={quoteHref}
              onClick={() => {
                const d = draft ?? readCommercialBookDraft();
                try {
                  sessionStorage.setItem(
                    "maidlinx.commercialQuote.notes",
                    commercialDraftQuoteNotes(d),
                  );
                  if (d.propertyType) {
                    sessionStorage.setItem(
                      "maidlinx.commercialQuote.segment",
                      d.propertyType === "office" ? "office" : "commercial",
                    );
                  }
                } catch {
                  /* ignore */
                }
              }}
              className="inline-flex h-12 items-center justify-center rounded-2xl border border-white/30 px-5 text-sm font-semibold text-white"
            >
              Request a quote
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
                  aria-pressed={selected}
                  className={cn(
                    "relative flex w-full flex-col rounded-2xl border px-4 py-4 text-left transition-colors",
                    selected
                      ? "border-[#04CED2] bg-[var(--ml-dark-surface,#102B49)] shadow-[0_0_0_1px_#04CED2]"
                      : "border-white/15 bg-[var(--ml-dark-surface,#102B49)] hover:border-white/30",
                  )}
                >
                  {selected ? (
                    <span
                      className="absolute top-3 right-3 flex size-6 items-center justify-center rounded-full bg-[#04CED2] text-[#01193D]"
                      aria-hidden
                    >
                      <Check className="size-3.5" strokeWidth={3} />
                    </span>
                  ) : (
                    <span
                      className="absolute top-3 right-3 size-6 rounded-full border border-white/35"
                      aria-hidden
                    />
                  )}

                  <span className="pr-9 text-[16px] font-semibold text-white">
                    {team.providerName}
                  </span>

                  {team.windowLabel ? (
                    <span className="mt-1.5 flex items-center gap-1.5 text-sm text-white/60">
                      <Clock className="size-3.5 shrink-0" aria-hidden />
                      {team.windowLabel}
                    </span>
                  ) : draft?.preferredTimeLabel ? (
                    <span className="mt-1.5 flex items-center gap-1.5 text-sm text-white/60">
                      <Clock className="size-3.5 shrink-0" aria-hidden />
                      {draft.preferredTimeLabel}
                    </span>
                  ) : (
                    <span className="mt-1.5 block text-sm text-white/55">
                      Window TBD
                    </span>
                  )}

                  <span className="mt-3 text-[1.35rem] font-bold tracking-tight text-white">
                    {team.visitCents > 0
                      ? `${formatCents(team.visitCents)} / visit`
                      : "Quote pending"}
                  </span>

                  {typeof team.reviewCount === "number" &&
                  team.reviewCount > 0 &&
                  typeof team.ratingAvg === "number" ? (
                    <span className="mt-1 text-xs text-white/50">
                      {team.ratingAvg.toFixed(1)} · {team.reviewCount} review
                      {team.reviewCount === 1 ? "" : "s"}
                    </span>
                  ) : null}

                  <Link
                    href={checklistHref(team.proposalId)}
                    onClick={(e) => e.stopPropagation()}
                    className="mt-3 text-[14px] font-semibold text-[#04CED2] underline-offset-2 hover:underline"
                  >
                    View cleaning checklist
                  </Link>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {cards.length > 0 ? (
        <div className="fixed inset-x-0 bottom-[calc(3.75rem+env(safe-area-inset-bottom))] z-30 border-t border-white/10 bg-[#01193D]/95 px-5 pt-3 pb-3 backdrop-blur-md lg:static lg:bottom-auto lg:border-0 lg:bg-transparent lg:p-0 lg:backdrop-blur-none">
          <div className="mx-auto w-full max-w-[390px] lg:max-w-[430px]">
            <CommercialCtaButton href={reviewHref} disabled={!selectedId}>
              Review booking
            </CommercialCtaButton>
          </div>
        </div>
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
