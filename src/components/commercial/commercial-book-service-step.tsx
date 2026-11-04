"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronRight, Sparkles } from "lucide-react";
import {
  COMMERCIAL_SERVICE_OPTIONS,
  readCommercialBookDraft,
  writeCommercialBookDraft,
  type CommercialServiceId,
} from "@/lib/commercial/book-draft";
import { routes } from "@/config/site";

interface CommercialBookServiceStepProps {
  publicPath?: boolean;
}

/** What needs cleaning — advances to frequency; Back preserves. */
export function CommercialBookServiceStep({
  publicPath = false,
}: CommercialBookServiceStepProps) {
  const router = useRouter();
  const [blocked, setBlocked] = useState(false);

  const backHref = publicPath
    ? routes.bookCommercialProperty
    : routes.dashboardBookProperty;
  const nextHref = publicPath
    ? routes.bookCommercialFrequency
    : routes.dashboardBookFrequency;

  useEffect(() => {
    const draft = readCommercialBookDraft();
    if (
      !draft.propertyType &&
      !draft.siteId &&
      !draft.line1?.trim() &&
      !draft.postalCode?.trim()
    ) {
      setBlocked(true);
      router.replace(
        publicPath ? routes.bookCommercialProperty : routes.dashboardBookProperty,
      );
    }
  }, [router, publicPath]);

  function select(id: CommercialServiceId, label: string) {
    writeCommercialBookDraft({
      serviceId: id,
      serviceLabel: label,
      frequency: null,
      preferredTimeId: null,
      preferredTimeLabel: null,
      proposalId: null,
    });
    router.push(nextHref);
  }

  if (blocked) {
    return (
      <p className="text-sm text-[var(--ml-dark-ink-muted)]">
        Choose a property type first…
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
          What needs cleaning?
        </h1>
        <p className="text-sm text-[var(--ml-dark-ink-muted)]">
          One commercial clean type for this visit cadence.
        </p>
      </header>

      <ul className="overflow-hidden rounded-2xl border border-white/10 bg-[var(--ml-dark-surface)]">
        {COMMERCIAL_SERVICE_OPTIONS.map((opt, i) => (
          <li key={opt.id}>
            <button
              type="button"
              onClick={() => select(opt.id, opt.label)}
              className={
                i < COMMERCIAL_SERVICE_OPTIONS.length - 1
                  ? "flex w-full items-center gap-3 border-b border-white/10 px-4 py-4 text-left transition-colors hover:bg-white/5"
                  : "flex w-full items-center gap-3 px-4 py-4 text-left transition-colors hover:bg-white/5"
              }
            >
              <span className="text-[#04CED2]">
                <Sparkles className="size-5" aria-hidden />
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
