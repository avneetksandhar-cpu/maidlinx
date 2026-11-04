"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { SiteKindIcon } from "@/components/business/site-kind-icon";
import { Button, Input } from "@/components/ui";
import type { SavedAddress } from "@/lib/addresses/types";
import {
  frequencyLabel,
  isScopeReadyForQuote,
  readSiteScope,
  scopeSummaryLine,
  type SiteScope,
} from "@/lib/business/site-scope";
import { routes } from "@/config/site";

interface CompareQuotesProps {
  site: SavedAddress;
  /** Prefill from authenticated customer session when available. */
  defaultEmail?: string | null;
  defaultName?: string | null;
  /** Real upcoming jobs for this site address — never illustrative providers. */
  realJobs: Array<{
    id: string;
    professionalName: string | null;
    totalCents: number;
    currency: string;
    status: string;
    scheduledAt: string;
  }>;
}

/**
 * Screen 3 — Compare quotes / request proposals.
 * Does NOT invent Bayline/Coastal sample cards. Empty → Request quotes → owner_sales_leads.
 * When a real assigned booking exists, surface it as a live proposal/order.
 */
export function CompareQuotes({
  site,
  realJobs,
  defaultEmail,
  defaultName,
}: CompareQuotesProps) {
  const [scope, setScope] = useState<SiteScope | null>(null);
  const [companyName, setCompanyName] = useState("");
  const [contactEmail, setContactEmail] = useState(defaultEmail?.trim() ?? "");
  const [contactName, setContactName] = useState(defaultName?.trim() ?? "");
  const [contactPhone, setContactPhone] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [honeypot, setHoneypot] = useState("");

  useEffect(() => {
    setScope(readSiteScope(site.id));
  }, [site.id]);

  const scopeLine = useMemo(() => {
    if (!scope) return "Scope not set yet";
    const freq = frequencyLabel(scope.frequency);
    const summary = scopeSummaryLine(scope);
    return summary === "Scope not set yet"
      ? freq
      : `${freq} · ${summary}`;
  }, [scope]);

  async function requestQuotes() {
    setLoading(true);
    setStatus(null);
    try {
      if (!isScopeReadyForQuote(scope)) {
        throw new Error("Define scope before requesting quotes.");
      }
      if (!companyName.trim() || !contactEmail.trim()) {
        throw new Error("Company name and work email are required.");
      }

      const notes = [
        `Site: ${site.label}`,
        `Address: ${site.addressLine1}, ${site.city}, ${site.region} ${site.postalCode}`,
        `Scope: ${scopeLine}`,
        scope?.siteContact ? `Site contact: ${scope.siteContact}` : null,
        scope?.accessNotes ? `Access: ${scope.accessNotes}` : null,
        `Site id: ${site.id}`,
      ]
        .filter(Boolean)
        .join("\n");

      const res = await fetch("/api/leads/business", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: companyName.trim(),
          contactName: contactName.trim() || null,
          contactEmail: contactEmail.trim(),
          contactPhone: contactPhone.trim() || null,
          segment: "commercial",
          notes,
          website: honeypot || null,
        }),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Unable to submit quote request.");
      setStatus("Quote request sent — MaidLinx will follow up with real proposals. No sample providers shown.");
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Unable to submit.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-[430px] space-y-5 lg:max-w-none">
      <header className="space-y-3">
        <Link
          href={routes.dashboardSiteScope(site.id)}
          className="inline-flex text-sm font-semibold text-[#04CED2]"
        >
          ← Scope
        </Link>
        <h1 className="text-[1.85rem] font-bold tracking-tight text-white">
          Compare quotes
        </h1>
        <div className="flex items-center gap-3">
          <SiteKindIcon label={site.label} />
          <div className="min-w-0">
            <p className="font-semibold text-white">{site.label}</p>
            <p className="text-sm text-[var(--ml-dark-ink-muted)]">
              Scope: {scopeLine}
            </p>
          </div>
        </div>
      </header>

      {realJobs.length > 0 ? (
        <ul className="space-y-3">
          {realJobs.map((job) => (
            <li key={job.id}>
              <Link
                href={routes.dashboardJob(job.id)}
                className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--ml-dark-border)] bg-[var(--ml-dark-surface)] px-4 py-4"
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold text-white">
                    {job.professionalName?.trim() || "Assigned provider TBD"}
                  </p>
                  <p className="text-sm text-[var(--ml-dark-ink-muted)]">
                    {job.status.replaceAll("_", " ")} ·{" "}
                    {new Date(job.scheduledAt).toLocaleString(undefined, {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <p className="shrink-0 text-sm font-semibold tabular-nums text-[#04CED2]">
                  {job.totalCents > 0
                    ? `$${(job.totalCents / 100).toFixed(0)} / visit`
                    : "Quote"}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="rounded-2xl border border-dashed border-[var(--ml-dark-border)] bg-[var(--ml-dark-surface)] px-4 py-8 text-center">
          <p className="text-sm font-semibold text-white">No provider proposals yet</p>
          <p className="mt-1.5 text-sm text-[var(--ml-dark-ink-muted)]">
            We only show real cleaners and CRM quotes — never illustrative sample pricing.
          </p>
        </div>
      )}

      <div className="space-y-3 rounded-2xl border border-[var(--ml-dark-border)] bg-[var(--ml-dark-surface)] p-4">
        <p className="text-sm font-semibold text-white">Request quotes</p>
        <p className="text-xs text-[var(--ml-dark-ink-muted)]">
          Sends your site + scope to MaidLinx sales (`owner_sales_leads`). Stripe LIVE stays OFF.
        </p>
        <Input
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          placeholder="Company name"
          className="h-11 rounded-xl border-[var(--ml-dark-border)] bg-[var(--ml-dark-bg)] text-white"
          autoComplete="organization"
        />
        <Input
          value={contactName}
          onChange={(e) => setContactName(e.target.value)}
          placeholder="Your name"
          className="h-11 rounded-xl border-[var(--ml-dark-border)] bg-[var(--ml-dark-bg)] text-white"
          autoComplete="name"
        />
        <Input
          type="email"
          value={contactEmail}
          onChange={(e) => setContactEmail(e.target.value)}
          placeholder="Work email"
          className="h-11 rounded-xl border-[var(--ml-dark-border)] bg-[var(--ml-dark-bg)] text-white"
          autoComplete="email"
          required
        />
        <Input
          value={contactPhone}
          onChange={(e) => setContactPhone(e.target.value)}
          placeholder="Phone (optional)"
          className="h-11 rounded-xl border-[var(--ml-dark-border)] bg-[var(--ml-dark-bg)] text-white"
          autoComplete="tel"
        />
        {/* honeypot */}
        <input
          type="text"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
          className="hidden"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden
        />
        {status ? (
          <p
            className="text-sm text-[var(--ml-dark-ink-muted)]"
            role="status"
          >
            {status}
          </p>
        ) : null}
        <Button
          type="button"
          variant="primary"
          className="h-14 w-full rounded-2xl bg-[#04CED2] text-base font-semibold text-[#01193D] hover:bg-[#03b8bc]"
          disabled={loading}
          onClick={() => void requestQuotes()}
        >
          {loading ? "Sending…" : "Request quotes"}
        </Button>
      </div>

      {realJobs[0] ? (
        <Link href={routes.dashboardJob(realJobs[0].id)} className="block">
          <Button
            variant="secondary"
            className="h-12 w-full rounded-2xl border-white/50 bg-transparent font-semibold text-white"
          >
            Review proposal
          </Button>
        </Link>
      ) : null}
    </div>
  );
}
