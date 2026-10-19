"use client";

import { useState } from "react";
import { Button, Input, Textarea } from "@/components/ui";

export function BusinessLeadForm() {
  const [companyName, setCompanyName] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [segment, setSegment] = useState("commercial");
  const [notes, setNotes] = useState("");
  const [website, setWebsite] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "Unable to submit.");
      setStatus("Thanks — we’ll follow up shortly.");
      setCompanyName("");
      setContactName("");
      setContactEmail("");
      setContactPhone("");
      setNotes("");
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Unable to submit.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-3 rounded-xl border border-border bg-surface p-5 shadow-soft">
      <p className="text-sm font-semibold text-ink">Request business cleaning</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block space-y-1 text-sm">
          <span className="font-medium text-ink">Company</span>
          <Input
            required
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            autoComplete="organization"
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="font-medium text-ink">Your name</span>
          <Input
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
            autoComplete="name"
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="font-medium text-ink">Work email</span>
          <Input
            required
            type="email"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            autoComplete="email"
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="font-medium text-ink">Phone (optional)</span>
          <Input
            type="tel"
            value={contactPhone}
            onChange={(e) => setContactPhone(e.target.value)}
            autoComplete="tel"
          />
        </label>
        <label className="block space-y-1 text-sm sm:col-span-2">
          <span className="font-medium text-ink">Segment</span>
          <select
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
            value={segment}
            onChange={(e) => setSegment(e.target.value)}
          >
            <option value="office">Office</option>
            <option value="commercial">Commercial</option>
            <option value="property_manager">Property manager</option>
            <option value="airbnb">Airbnb / short-term</option>
            <option value="other">Other</option>
          </select>
        </label>
        <label className="block space-y-1 text-sm sm:col-span-2">
          <span className="font-medium text-ink">What do you need?</span>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Locations, frequency, square footage…"
          />
        </label>
      </div>
      {/* Honeypot */}
      <label className="sr-only" aria-hidden="true">
        Website
        <input
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
        />
      </label>
      {status ? <p className="text-sm text-ink-muted">{status}</p> : null}
      <Button type="submit" variant="primary" size="lg" disabled={loading} className="w-full sm:w-auto">
        {loading ? "Sending…" : "Request a quote"}
      </Button>
    </form>
  );
}
