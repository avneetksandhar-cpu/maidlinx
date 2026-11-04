"use client";

import { useState } from "react";
import {
  ENTRY_METHOD_LABELS,
  ENTRY_METHODS,
  type EntryApplyScope,
  type EntryMethod,
  type VisitEntryInstructions,
} from "@/lib/commercial/entry-instructions";
import { CommercialCtaButton } from "@/components/commercial/commercial-book-chrome";
import { cn } from "@/lib/utils";

interface CommercialEntryInstructionsProps {
  bookingId: string;
  initialEntry: VisitEntryInstructions | null;
  /** When false, hide the primary CTA (e.g. still confirming). */
  enabled?: boolean;
  onSaved?: (entry: VisitEntryInstructions) => void;
}

/**
 * Post-confirm entry flow — how the crew gets in after hours.
 * Private; never rendered on receipts/email.
 */
export function CommercialEntryInstructions({
  bookingId,
  initialEntry,
  enabled = true,
  onSaved,
}: CommercialEntryInstructionsProps) {
  const [entry, setEntry] = useState<VisitEntryInstructions | null>(initialEntry);
  const [editing, setEditing] = useState(!initialEntry);
  const [method, setMethod] = useState<EntryMethod>(
    initialEntry?.method ?? "reception",
  );
  const [note, setNote] = useState(initialEntry?.note ?? "");
  const [applyTo, setApplyTo] = useState<EntryApplyScope>(
    initialEntry?.applyTo ?? "this_visit",
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/commercial/entry-instructions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId,
          method,
          note: note.trim(),
          applyTo,
        }),
      });
      const json = (await res.json().catch(() => ({}))) as {
        error?: string;
        data?: { entry?: VisitEntryInstructions };
      };
      if (!res.ok || !json.data?.entry) {
        throw new Error(json.error ?? "Unable to save entry instructions.");
      }
      setEntry(json.data.entry);
      setEditing(false);
      onSaved?.(json.data.entry);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save.");
    } finally {
      setSaving(false);
    }
  }

  if (!enabled) return null;

  if (entry && !editing) {
    return (
      <section className="rounded-2xl border border-white/10 bg-[var(--ml-dark-surface,#102B49)] px-4 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold tracking-wide text-white/55 uppercase">
              Entry instructions
            </p>
            <p className="mt-1 text-[15px] font-semibold text-white">
              {ENTRY_METHOD_LABELS[entry.method]}
            </p>
            {entry.note.trim() ? (
              <p className="mt-1 whitespace-pre-wrap text-sm text-white/70">
                {entry.note}
              </p>
            ) : null}
            <p className="mt-2 text-xs text-white/45">
              {entry.applyTo === "future_visits"
                ? "Applies to future visits at this property"
                : "Applies to this visit only"}
              {" · "}Shared with assigned crew only
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setMethod(entry.method);
              setNote(entry.note);
              setApplyTo(entry.applyTo);
              setEditing(true);
            }}
            className="shrink-0 text-sm font-semibold text-[#04CED2]"
          >
            Edit
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-4 rounded-2xl border border-[#04CED2]/35 bg-[var(--ml-dark-surface,#102B49)] px-4 py-4">
      <div>
        <p className="text-[11px] font-semibold tracking-wide text-white/55 uppercase">
          After-hours entry
        </p>
        <h2 className="mt-1 text-[1.15rem] font-bold tracking-tight text-white">
          How should the crew get in?
        </h2>
      </div>

      <div className="space-y-2" role="radiogroup" aria-label="Entry method">
        {ENTRY_METHODS.map((id) => (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={method === id}
            onClick={() => setMethod(id)}
            className={cn(
              "flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left text-sm font-semibold transition-colors",
              method === id
                ? "border-[#04CED2] bg-[#04CED2]/10 text-white"
                : "border-white/10 bg-transparent text-white/80 hover:border-white/25",
            )}
          >
            <span
              className={cn(
                "flex size-4 shrink-0 items-center justify-center rounded-full border",
                method === id
                  ? "border-[#04CED2] bg-[#04CED2]"
                  : "border-white/35",
              )}
              aria-hidden
            >
              {method === id ? (
                <span className="size-1.5 rounded-full bg-[#01193D]" />
              ) : null}
            </span>
            {ENTRY_METHOD_LABELS[id]}
          </button>
        ))}
      </div>

      <div>
        <label
          htmlFor={`entry-note-${bookingId}`}
          className="text-xs font-medium text-white/55"
        >
          Short note (optional)
        </label>
        <textarea
          id={`entry-note-${bookingId}`}
          value={note}
          onChange={(e) => setNote(e.target.value.slice(0, 500))}
          rows={3}
          placeholder="Suite, door code hint, who to ask for…"
          className="mt-1.5 w-full resize-none rounded-xl border border-white/15 bg-[#01193D] px-3 py-2.5 text-sm text-white placeholder:text-white/35 focus:border-[#04CED2] focus:outline-none"
        />
      </div>

      <div className="space-y-2" role="radiogroup" aria-label="Apply to">
        {(
          [
            ["this_visit", "This visit only"],
            ["future_visits", "Future visits at this property"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={applyTo === id}
            onClick={() => setApplyTo(id)}
            className={cn(
              "flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left text-sm transition-colors",
              applyTo === id
                ? "border-[#04CED2]/60 bg-[#04CED2]/8 text-white"
                : "border-white/10 text-white/70 hover:border-white/25",
            )}
          >
            <span
              className={cn(
                "size-3.5 shrink-0 rounded-full border",
                applyTo === id
                  ? "border-[#04CED2] bg-[#04CED2]"
                  : "border-white/35",
              )}
              aria-hidden
            />
            {label}
          </button>
        ))}
      </div>

      {error ? (
        <p className="text-sm text-red-300" role="alert">
          {error}
        </p>
      ) : null}

      <CommercialCtaButton disabled={saving} onClick={() => void save()}>
        {saving ? "Saving…" : entry ? "Save entry instructions" : "Add entry instructions"}
      </CommercialCtaButton>

      {entry ? (
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="w-full text-center text-sm font-semibold text-white/55"
        >
          Cancel
        </button>
      ) : null}

      <p className="text-center text-[11px] text-white/40">
        Private — assigned crew only. Never shown on receipts or email.
      </p>
    </section>
  );
}
