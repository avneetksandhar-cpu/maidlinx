"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CalendarDays, ChevronRight } from "lucide-react";
import {
  COMMERCIAL_FREQUENCY_OPTIONS,
  readCommercialBookDraft,
  writeCommercialBookDraft,
} from "@/lib/commercial/book-draft";
import type { CommercialFrequency } from "@/lib/commercial/types";
import { routes } from "@/config/site";

interface CommercialBookFrequencyStepProps {
  publicPath?: boolean;
}

/** How often — advances to preferred time; Back preserves. */
export function CommercialBookFrequencyStep({
  publicPath = false,
}: CommercialBookFrequencyStepProps) {
  const router = useRouter();
  const [blocked, setBlocked] = useState(false);

  const backHref = publicPath
    ? routes.bookCommercialService
    : routes.dashboardBookService;
  const nextHref = publicPath
    ? routes.bookCommercialTime
    : routes.dashboardBookTime;

  useEffect(() => {
    const draft = readCommercialBookDraft();
    if (!draft.serviceId) {
      setBlocked(true);
      router.replace(
        publicPath ? routes.bookCommercialService : routes.dashboardBookService,
      );
    }
  }, [router, publicPath]);

  function select(id: CommercialFrequency) {
    writeCommercialBookDraft({
      frequency: id,
      preferredTimeId: null,
      preferredTimeLabel: null,
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
          How often?
        </h1>
        <p className="text-sm text-[var(--ml-dark-ink-muted)]">
          One-time or recurring commercial cleans.
        </p>
      </header>

      <ul className="overflow-hidden rounded-2xl border border-white/10 bg-[var(--ml-dark-surface)]">
        {COMMERCIAL_FREQUENCY_OPTIONS.map((opt, i) => (
          <li key={opt.id}>
            <button
              type="button"
              onClick={() => select(opt.id)}
              className={
                i < COMMERCIAL_FREQUENCY_OPTIONS.length - 1
                  ? "flex w-full items-center gap-3 border-b border-white/10 px-4 py-4 text-left transition-colors hover:bg-white/5"
                  : "flex w-full items-center gap-3 px-4 py-4 text-left transition-colors hover:bg-white/5"
              }
            >
              <span className="text-[#04CED2]">
                <CalendarDays className="size-5" aria-hidden />
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
