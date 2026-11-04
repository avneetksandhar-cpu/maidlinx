"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { SiteKindIcon, siteKindSubtitle } from "@/components/business/site-kind-icon";
import { GoogleMapsProvider } from "@/components/booking/google-maps-provider";
import { AddressAutocomplete } from "@/components/booking/address-autocomplete";
import { Button, Input, Label } from "@/components/ui";
import { ADDRESS_LABEL_PRESETS } from "@/lib/addresses/types";
import type { SavedAddress } from "@/lib/addresses/types";
import { bookingToStructuredAddress } from "@/lib/addresses/map";
import type { Step1Address } from "@/lib/validations/booking-flow";
import { routes } from "@/config/site";

interface SitesSelectProps {
  initialSites: SavedAddress[];
}

/**
 * Screen 1 — Which site needs cleaning?
 * Real saved addresses only; no illustrative Brickell / Las Olas cards.
 */
export function SitesSelect({ initialSites }: SitesSelectProps) {
  return (
    <GoogleMapsProvider>
      <SitesSelectInner initialSites={initialSites} />
    </GoogleMapsProvider>
  );
}

function SitesSelectInner({ initialSites }: SitesSelectProps) {
  const router = useRouter();
  const [sites, setSites] = useState(initialSites);
  const [adding, setAdding] = useState(sites.length === 0);
  const [draft, setDraft] = useState<Partial<Step1Address>>({ country: "US" });
  const [label, setLabel] = useState<string>("Office");
  const [customLabel, setCustomLabel] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    const response = await fetch("/api/dashboard/addresses", { credentials: "include" });
    if (!response.ok) return;
    const payload = (await response.json()) as { data?: { addresses?: SavedAddress[] } };
    setSites(payload.data?.addresses ?? []);
    router.refresh();
  }

  async function handleCreate() {
    setError(null);
    const structured = bookingToStructuredAddress(draft);
    if (!structured) {
      setError("Select a Google address suggestion before saving.");
      return;
    }
    const finalLabel =
      label === "Other" ? customLabel.trim() || "Other" : label.trim() || "Office";

    setBusy(true);
    try {
      const response = await fetch("/api/dashboard/addresses", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...structured,
          label: finalLabel,
          isDefault: sites.length === 0,
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Unable to save site.");
      const created = payload.data?.address as SavedAddress | undefined;
      setAdding(false);
      setDraft({ country: "US" });
      await refresh();
      if (created?.id) {
        router.push(routes.dashboardSiteScope(created.id));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save site.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-[430px] space-y-6 lg:max-w-none">
      <header className="space-y-1">
        <h1 className="text-[1.85rem] font-bold tracking-tight text-white">
          Which site needs cleaning?
        </h1>
        <p className="text-[15px] font-normal text-[var(--ml-dark-ink-muted)]">
          Pick a saved South Florida office, storefront, or property — or add one.
        </p>
      </header>

      {sites.length > 0 ? (
        <ul className="space-y-3">
          {sites.map((site) => (
            <li key={site.id}>
              <Link
                href={routes.dashboardSiteScope(site.id)}
                className="flex items-center gap-3 rounded-2xl border border-[var(--ml-dark-border)] bg-[var(--ml-dark-surface)] px-4 py-4 transition-colors hover:border-[#04CED2]/50"
              >
                <SiteKindIcon label={site.label} />
                <div className="min-w-0">
                  <p className="truncate text-[16px] font-semibold text-white">
                    {site.label}
                  </p>
                  <p className="truncate text-[13px] text-[var(--ml-dark-ink-muted)]">
                    {siteKindSubtitle(site.label, site.city)}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-2xl border border-dashed border-[var(--ml-dark-border)] bg-[var(--ml-dark-surface)] px-4 py-8 text-center text-sm text-[var(--ml-dark-ink-muted)]">
          No sites yet. Add your first office or storefront to request quotes or book a visit.
        </p>
      )}

      {adding ? (
        <div className="space-y-3 rounded-2xl border border-[var(--ml-dark-border)] bg-[var(--ml-dark-surface)] p-4">
          <p className="text-sm font-semibold text-white">Add a site</p>
          <div className="space-y-1.5">
            <Label className="text-white/80">Site name</Label>
            <select
              className="h-11 w-full rounded-xl border border-[var(--ml-dark-border)] bg-[var(--ml-dark-bg)] px-3 text-sm text-white"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
            >
              {ADDRESS_LABEL_PRESETS.map((preset) => (
                <option key={preset} value={preset}>
                  {preset}
                </option>
              ))}
            </select>
            {label === "Other" ? (
              <Input
                value={customLabel}
                onChange={(e) => setCustomLabel(e.target.value)}
                placeholder="Custom label"
                className="mt-2 border-[var(--ml-dark-border)] bg-[var(--ml-dark-bg)] text-white"
              />
            ) : null}
          </div>
          <div className="space-y-1.5">
            <Label className="text-white/80">Address</Label>
            <AddressAutocomplete
              value={draft}
              onChange={setDraft}
              locationBiasMarket="SOUTH_FLORIDA"
              label="Site address"
              placeholder="South Florida street address"
            />
          </div>
          {error ? (
            <p className="text-sm text-red-300" role="alert">
              {error}
            </p>
          ) : null}
          <div className="flex gap-2">
            <Button
              type="button"
              variant="primary"
              className="h-12 flex-1 rounded-2xl bg-[#04CED2] font-semibold text-[#01193D] hover:bg-[#03b8bc]"
              disabled={busy}
              onClick={() => void handleCreate()}
            >
              {busy ? "Saving…" : "Save site"}
            </Button>
            {sites.length > 0 ? (
              <Button
                type="button"
                variant="secondary"
                className="h-12 rounded-2xl border-white/40 bg-transparent text-white"
                onClick={() => setAdding(false)}
              >
                Cancel
              </Button>
            ) : null}
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="flex h-12 w-full items-center justify-center rounded-2xl border border-white/70 text-[15px] font-semibold text-white transition-colors hover:bg-white/5"
        >
          + Add a site
        </button>
      )}

      <p className="text-center text-xs text-[var(--ml-dark-ink-subtle)]">
        Need a home clean instead?{" "}
        <Link href={routes.home} className="font-medium text-[#04CED2] underline-offset-2 hover:underline">
          Residential booking
        </Link>
      </p>
    </div>
  );
}
