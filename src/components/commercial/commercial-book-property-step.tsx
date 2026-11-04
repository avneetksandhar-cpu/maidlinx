"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Building2, ChevronRight, Plus } from "lucide-react";
import {
  COMMERCIAL_PROPERTY_TYPE_OPTIONS,
  readCommercialBookDraft,
  writeCommercialBookDraft,
} from "@/lib/commercial/book-draft";
import type { PropertyType } from "@/lib/commercial/types";
import type { SavedAddress } from "@/lib/addresses/types";
import { routes } from "@/config/site";

interface CommercialBookPropertyStepProps {
  sites?: SavedAddress[];
  /** Public pre-auth intake uses /book/commercial/* routes. */
  publicPath?: boolean;
}

/** Property type (+ optional saved site). Advances to service; Back preserves draft. */
export function CommercialBookPropertyStep({
  sites = [],
  publicPath = false,
}: CommercialBookPropertyStepProps) {
  const router = useRouter();
  const [hasAddress, setHasAddress] = useState(false);
  const [addressLabel, setAddressLabel] = useState<string | null>(null);

  const backHref = publicPath ? routes.home : routes.dashboardBook;
  const nextHref = publicPath
    ? routes.bookCommercialService
    : routes.dashboardBookService;

  useEffect(() => {
    const d = readCommercialBookDraft();
    const label =
      d.siteLabel ||
      [d.line1, d.city, d.region, d.postalCode].filter(Boolean).join(", ") ||
      null;
    setAddressLabel(label);
    setHasAddress(Boolean(d.line1?.trim() || d.postalCode?.trim() || d.siteId));
  }, []);

  function selectType(type: PropertyType, label: string) {
    const d = readCommercialBookDraft();
    writeCommercialBookDraft({
      propertyType: type,
      siteLabel: d.siteLabel || label,
      // Keep siteId if already chosen; reset downstream
      serviceId: null,
      serviceLabel: null,
      frequency: null,
      preferredTimeId: null,
      preferredTimeLabel: null,
      proposalId: null,
    });
    router.push(nextHref);
  }

  function selectSite(site: SavedAddress) {
    writeCommercialBookDraft({
      siteId: site.id,
      siteLabel: site.label?.trim() || site.addressLine1,
      line1: site.addressLine1,
      city: site.city,
      region: site.region,
      postalCode: site.postalCode,
      country: site.country,
      propertyType: null,
      serviceId: null,
      serviceLabel: null,
      frequency: null,
      preferredTimeId: null,
      preferredTimeLabel: null,
      proposalId: null,
    });
    // Still need property type on next interaction — stay and highlight types
    setAddressLabel(site.label?.trim() || site.addressLine1);
    setHasAddress(true);
  }

  return (
    <div className="mx-auto w-full max-w-[390px] space-y-5 lg:max-w-[430px]">
      <header className="space-y-2">
        <Link href={backHref} className="inline-flex text-sm font-semibold text-[#04CED2]">
          ← Back
        </Link>
        <h1 className="text-[1.75rem] font-bold tracking-tight text-white">
          What type of property?
        </h1>
        <p className="text-sm text-[var(--ml-dark-ink-muted)]">
          {addressLabel
            ? `For ${addressLabel}`
            : "Pick the property type for this commercial clean."}
        </p>
      </header>

      <ul className="overflow-hidden rounded-2xl border border-white/10 bg-[var(--ml-dark-surface)]">
        {COMMERCIAL_PROPERTY_TYPE_OPTIONS.map((opt, i) => (
          <li key={opt.id}>
            <button
              type="button"
              onClick={() => selectType(opt.id, opt.label)}
              className={
                i < COMMERCIAL_PROPERTY_TYPE_OPTIONS.length - 1
                  ? "flex w-full items-center gap-3 border-b border-white/10 px-4 py-4 text-left transition-colors hover:bg-white/5"
                  : "flex w-full items-center gap-3 px-4 py-4 text-left transition-colors hover:bg-white/5"
              }
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#04CED2]/15 text-[#04CED2]">
                <Building2 className="size-5" aria-hidden />
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

      {!publicPath && sites.length > 0 ? (
        <div className="space-y-2">
          <p className="text-[11px] font-semibold tracking-wide text-white/45 uppercase">
            Or use a saved workplace
          </p>
          <ul className="overflow-hidden rounded-2xl border border-white/10 bg-[var(--ml-dark-surface)]">
            {sites.map((site, i) => (
              <li key={site.id}>
                <button
                  type="button"
                  onClick={() => selectSite(site)}
                  className={
                    i < sites.length - 1
                      ? "flex w-full items-center gap-3 border-b border-white/10 px-4 py-3.5 text-left hover:bg-white/5"
                      : "flex w-full items-center gap-3 px-4 py-3.5 text-left hover:bg-white/5"
                  }
                >
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
        </div>
      ) : null}

      {!publicPath && sites.length === 0 && !hasAddress ? (
        <div className="rounded-2xl border border-dashed border-white/15 bg-[var(--ml-dark-surface)] px-4 py-6 text-center">
          <p className="text-sm text-white/55">
            No saved workplaces yet. Start from the homepage address check, or add a
            site.
          </p>
          <Link
            href={routes.dashboardSites}
            className="mt-4 inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#04CED2] px-5 text-sm font-semibold text-[#01193D]"
          >
            <Plus className="size-4" aria-hidden />
            Add a site
          </Link>
        </div>
      ) : null}
    </div>
  );
}
