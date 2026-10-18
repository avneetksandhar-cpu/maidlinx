"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function OwnerSalesForm() {
  const router = useRouter();
  const [companyName, setCompanyName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [segment, setSegment] = useState("commercial");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await fetch("/api/owner/sales", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ companyName, contactEmail, segment }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok) {
        setError(data.error ?? "Create failed.");
        return;
      }
      setCompanyName("");
      setContactEmail("");
      router.refresh();
    });
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-xl border border-border bg-surface p-4 shadow-card"
    >
      <p className="text-sm font-medium text-ink">Add lead</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <label className="text-xs text-ink-muted">
          Company
          <input
            required
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            className="mt-1 w-full rounded-md border border-border bg-surface-muted px-3 py-2 text-sm"
          />
        </label>
        <label className="text-xs text-ink-muted">
          Email
          <input
            type="email"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            className="mt-1 w-full rounded-md border border-border bg-surface-muted px-3 py-2 text-sm"
          />
        </label>
        <label className="text-xs text-ink-muted">
          Segment
          <select
            value={segment}
            onChange={(e) => setSegment(e.target.value)}
            className="mt-1 w-full rounded-md border border-border bg-surface-muted px-3 py-2 text-sm"
          >
            <option value="commercial">commercial</option>
            <option value="property_manager">property_manager</option>
            <option value="office">office</option>
            <option value="airbnb">airbnb</option>
            <option value="other">other</option>
          </select>
        </label>
      </div>
      {error && <p className="mt-2 text-sm text-rose-700">{error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="mt-3 rounded-md bg-ink px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
      >
        {pending ? "Saving…" : "Create lead"}
      </button>
    </form>
  );
}
