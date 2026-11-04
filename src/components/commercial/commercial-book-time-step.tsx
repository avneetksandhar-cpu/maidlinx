"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronRight, Clock } from "lucide-react";
import {
  COMMERCIAL_TIME_OPTIONS,
  readCommercialBookDraft,
  writeCommercialBookDraft,
  type CommercialTimeId,
} from "@/lib/commercial/book-draft";
import { routes } from "@/config/site";

interface CommercialBookTimeStepProps {
  publicPath?: boolean;
}

/** Preferred arrival window — advances to team selection; Back preserves. */
export function CommercialBookTimeStep({
  publicPath = false,
}: CommercialBookTimeStepProps) {
  const router = useRouter();
  const [blocked, setBlocked] = useState(false);

  const backHref = publicPath
    ? routes.bookCommercialFrequency
    : routes.dashboardBookFrequency;
  const nextHref = publicPath
    ? routes.bookCommercialTeams
    : routes.dashboardBookTeams;

  useEffect(() => {
    const draft = readCommercialBookDraft();
    if (!draft.frequency) {
      setBlocked(true);
      router.replace(
        publicPath
          ? routes.bookCommercialFrequency
          : routes.dashboardBookFrequency,
      );
    }
  }, [router, publicPath]);

  function select(id: CommercialTimeId, label: string) {
    writeCommercialBookDraft({
      preferredTimeId: id,
      preferredTimeLabel: label,
      proposalId: null,
    });
    router.push(nextHref);
  }

  if (blocked) {
    return (
      <p className="text-sm text-[var(--ml-dark-ink-muted)]">
        Complete earlier steps…
      </p>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[390px] space-y-5 lg:max-w-[430px]">
      <header className="space-y-2">
        <Link href={backHref} className="inline-flex text-sm font-semibold text-[#04CED2]">
          ← Back
        </Link>
        <h1 className="text-[1.75rem] font-bold tracking-tight text-white">
          Preferred time
        </h1>
        <p className="text-sm text-[var(--ml-dark-ink-muted)]">
          When should the crew arrive for this visit?
        </p>
      </header>

      <ul className="overflow-hidden rounded-2xl border border-white/10 bg-[var(--ml-dark-surface)]">
        {COMMERCIAL_TIME_OPTIONS.map((opt, i) => (
          <li key={opt.id}>
            <button
              type="button"
              onClick={() => select(opt.id, opt.label)}
              className={
                i < COMMERCIAL_TIME_OPTIONS.length - 1
                  ? "flex w-full items-center gap-3 border-b border-white/10 px-4 py-4 text-left transition-colors hover:bg-white/5"
                  : "flex w-full items-center gap-3 px-4 py-4 text-left transition-colors hover:bg-white/5"
              }
            >
              <span className="text-[#04CED2]">
                <Clock className="size-5" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-semibold text-white">
                  {opt.label}
                </span>
                <span className="mt-0.5 block text-sm text-white/55">
                  {opt.subtitle}
                </span>
              </span>
              <ChevronRight className="size-5 shrink-0 text-[#04CED2]" aria-hidden />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
