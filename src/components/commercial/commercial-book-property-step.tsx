"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Building2, ChevronRight, Plus } from "lucide-react";
import { writeCommercialBookDraft } from "@/lib/commercial/book-draft";
import type { SavedAddress } from "@/lib/addresses/types";
import { routes } from "@/config/site";

interface CommercialBookPropertyStepProps {
  sites: SavedAddress[];
}

/** One-step property picker — returns to book hub with selection filled. */
export function CommercialBookPropertyStep({ sites }: CommercialBookPropertyStepProps) {
  const router = useRouter();

  function select(site: SavedAddress) {
    writeCommercialBookDraft({
      siteId: site.id,
      siteLabel: site.label?.trim() || site.addressLine1,
      // Reset downstream when property changes
      serviceId: null,
      serviceLabel: null,
      frequency: null,
      proposalId: null,
    });
    router.push(routes.dashboardBook);
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
          Choose property
        </h1>
        <p className="text-sm text-[var(--ml-dark-ink-muted)]">
          Pick the South Florida site for this commercial clean.
        </p>
      </header>

      {sites.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/15 bg-[var(--ml-dark-surface)] px-4 py-8 text-center">
          <p className="text-sm font-semibold text-white">No sites yet</p>
          <p className="mt-1.5 text-sm text-[var(--ml-dark-ink-muted)]">
            Add an office or storefront under Sites, then return here.
          </p>
          <Link
            href={routes.dashboardSites}
            className="mt-4 inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#04CED2] px-5 text-sm font-semibold text-[#01193D]"
          >
            <Plus className="size-4" aria-hidden />
            Add a site
          </Link>
        </div>
      ) : (
        <ul className="overflow-hidden rounded-2xl border border-white/10 bg-[var(--ml-dark-surface)]">
          {sites.map((site, i) => (
            <li key={site.id}>
              <button
                type="button"
                onClick={() => select(site)}
                className={
                  i < sites.length - 1
                    ? "flex w-full items-center gap-3 border-b border-white/10 px-4 py-4 text-left transition-colors hover:bg-white/5"
                    : "flex w-full items-center gap-3 px-4 py-4 text-left transition-colors hover:bg-white/5"
                }
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#04CED2]/15 text-[#04CED2]">
                  <Building2 className="size-5" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-semibold text-white">
                    {site.label}
                  </span>
                  <span className="mt-0.5 block truncate text-sm text-white/55">
                    {site.addressLine1}
                    {site.city ? `, ${site.city}` : ""}
                  </span>
                </span>
                <ChevronRight className="size-5 shrink-0 text-[#04CED2]" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
