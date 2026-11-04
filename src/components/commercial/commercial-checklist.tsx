"use client";

import Link from "next/link";
import { CheckSquare } from "lucide-react";
import { CommercialCtaButton } from "@/components/commercial/commercial-book-chrome";
import { areaLabel, checklistFromAreas } from "@/lib/commercial/types";
import { routes } from "@/config/site";

interface CommercialChecklistProps {
  areas: string[];
  inclusions?: string | null;
  exclusions?: string | null;
  proposalId?: string | null;
  siteLabel?: string | null;
  /** When true, show continue CTA to review. */
  showContinue?: boolean;
}

/**
 * Cleaning checklist from real scope areas / proposal inclusions — never invented tasks.
 */
export function CommercialChecklist({
  areas,
  inclusions,
  exclusions,
  proposalId,
  siteLabel,
  showContinue = true,
}: CommercialChecklistProps) {
  const items =
    areas.length > 0
      ? checklistFromAreas(areas)
      : checklistFromAreas(["restrooms", "floors", "breakroom", "common_areas"]);

  const reviewHref = proposalId
    ? `${routes.dashboardBookReview}?proposal=${encodeURIComponent(proposalId)}`
    : routes.dashboardBookReview;

  return (
    <div className="mx-auto w-full max-w-[390px] space-y-5 lg:max-w-[430px]">
      <header className="space-y-2">
        <Link
          href={
            proposalId
              ? routes.dashboardBookTeams
              : routes.dashboardBook
          }
          className="inline-flex text-sm font-semibold text-[#04CED2]"
        >
          ← Back
        </Link>
        <h1 className="text-[1.75rem] font-bold tracking-tight text-white">
          Cleaning checklist
        </h1>
        {siteLabel ? (
          <p className="text-sm text-[var(--ml-dark-ink-muted)]">{siteLabel}</p>
        ) : null}
      </header>

      <ul className="overflow-hidden rounded-2xl border border-white/10 bg-[var(--ml-dark-surface)]">
        {items.map((item, i) => (
          <li
            key={item.id}
            className={
              i < items.length - 1
                ? "flex items-center gap-3 border-b border-white/10 px-4 py-3.5"
                : "flex items-center gap-3 px-4 py-3.5"
            }
          >
            <CheckSquare className="size-5 shrink-0 text-[#04CED2]" aria-hidden />
            <span className="text-[15px] font-medium text-white">
              {item.label || areaLabel(item.id)}
            </span>
          </li>
        ))}
      </ul>

      {inclusions?.trim() ? (
        <div className="rounded-2xl border border-white/10 bg-[var(--ml-dark-surface)] px-4 py-3.5">
          <p className="text-[11px] font-semibold tracking-wide text-white/55 uppercase">
            Inclusions
          </p>
          <p className="mt-1 whitespace-pre-wrap text-sm text-white/85">
            {inclusions.trim()}
          </p>
        </div>
      ) : null}

      {exclusions?.trim() ? (
        <div className="rounded-2xl border border-white/10 bg-[var(--ml-dark-surface)] px-4 py-3.5">
          <p className="text-[11px] font-semibold tracking-wide text-white/55 uppercase">
            Exclusions
          </p>
          <p className="mt-1 whitespace-pre-wrap text-sm text-white/85">
            {exclusions.trim()}
          </p>
        </div>
      ) : null}

      {areas.length === 0 && !inclusions?.trim() ? (
        <p className="text-sm text-[var(--ml-dark-ink-muted)]">
          Default commercial areas shown until a site scope is saved. Define scope under
          Sites for a site-specific checklist.
        </p>
      ) : null}

      {showContinue ? (
        <CommercialCtaButton href={reviewHref}>Continue to review</CommercialCtaButton>
      ) : null}
    </div>
  );
}
