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

/** One-step frequency picker — returns to book hub with selection filled. */
export function CommercialBookFrequencyStep() {
  const router = useRouter();
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    const draft = readCommercialBookDraft();
    if (!draft.siteId) {
      setBlocked(true);
      router.replace(routes.dashboardBookProperty);
      return;
    }
    if (!draft.serviceId) {
      setBlocked(true);
      router.replace(routes.dashboardBookService);
    }
  }, [router]);

  function select(id: CommercialFrequency) {
    writeCommercialBookDraft({
      frequency: id,
      proposalId: null,
    });
    router.push(routes.dashboardBook);
  }

  if (blocked) {
    return (
      <p className="text-sm text-[var(--ml-dark-ink-muted)]">Complete earlier steps…</p>
    );
  }

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
          Choose frequency
        </h1>
        <p className="text-sm text-[var(--ml-dark-ink-muted)]">
          How often should this commercial clean recur?
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
