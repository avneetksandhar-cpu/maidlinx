"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  commercialDraftQuoteNotes,
  readCommercialBookDraft,
} from "@/lib/commercial/book-draft";
import { routes } from "@/config/site";

/**
 * Fallback quote when no crew — carries address + cleaning details from draft.
 * Manager only adds contact info.
 */
export function CommercialQuoteForm() {
  const [companyName, setCompanyName] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [segment, setSegment] = useState("office");
  const [notes, setNotes] = useState("");
  const [website, setWebsite] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const draft = readCommercialBookDraft();
    let fromSession = "";
    let segmentSession = "";
    try {
      fromSession = sessionStorage.getItem("maidlinx.commercialQuote.notes") ?? "";
      segmentSession =
        sessionStorage.getItem("maidlinx.commercialQuote.segment") ?? "";
    } catch {
      /* ignore */
    }
    setNotes(fromSession || commercialDraftQuoteNotes(draft));
    if (segmentSession) setSegment(segmentSession);
    else if (draft.propertyType === "office") setSegment("office");
    else if (draft.propertyType) setSegment("commercial");
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch("/api/leads/business", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName,
          contactName: contactName || null,
          contactEmail,
          contactPhone: contactPhone || null,
          segment,
          notes: notes || null,
          website: website || null,
        }),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Unable to submit.");
      setStatus("Thanks — we’ll follow up shortly.");
      try {
        sessionStorage.removeItem("maidlinx.commercialQuote.notes");
        sessionStorage.removeItem("maidlinx.commercialQuote.segment");
      } catch {
        /* ignore */
      }
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Unable to submit.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-[390px] space-y-5 lg:max-w-[430px]">
      <header className="space-y-2">
        <Link
          href={routes.bookCommercialTeams}
          className="inline-flex text-sm font-semibold text-[#04CED2]"
        >
          ← Back
        </Link>
        <h1 className="text-[1.75rem] font-bold tracking-tight text-white">
          Request a quote
        </h1>
        <p className="text-sm text-white/55">
          Your property and cleaning details are filled in — add contact info to
          finish.
        </p>
      </header>

      <form onSubmit={onSubmit} className="space-y-3">
        <label className="block space-y-1 text-sm">
          <span className="font-medium text-white/70">Company</span>
          <input
            required
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            autoComplete="organization"
            className="h-12 w-full rounded-xl border border-white/15 bg-white/5 px-3 text-[16px] text-white placeholder:text-white/35"
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="font-medium text-white/70">Your name</span>
          <input
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
            autoComplete="name"
            className="h-12 w-full rounded-xl border border-white/15 bg-white/5 px-3 text-[16px] text-white placeholder:text-white/35"
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="font-medium text-white/70">Work email</span>
          <input
            required
            type="email"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            autoComplete="email"
            className="h-12 w-full rounded-xl border border-white/15 bg-white/5 px-3 text-[16px] text-white placeholder:text-white/35"
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="font-medium text-white/70">Phone (optional)</span>
          <input
            type="tel"
            value={contactPhone}
            onChange={(e) => setContactPhone(e.target.value)}
            autoComplete="tel"
            className="h-12 w-full rounded-xl border border-white/15 bg-white/5 px-3 text-[16px] text-white placeholder:text-white/35"
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="font-medium text-white/70">Cleaning details</span>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={5}
            className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-[15px] text-white placeholder:text-white/35"
          />
        </label>
        <label className="sr-only" aria-hidden="true">
          Website
          <input
            tabIndex={-1}
            autoComplete="off"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
          />
        </label>
        {status ? <p className="text-sm text-white/70">{status}</p> : null}
        <button
          type="submit"
          disabled={loading}
          className="inline-flex h-14 w-full items-center justify-center rounded-2xl bg-[#04CED2] text-base font-semibold text-[#01193D] disabled:opacity-40"
        >
          {loading ? "Sending…" : "Request a quote"}
        </button>
      </form>
    </div>
  );
}
