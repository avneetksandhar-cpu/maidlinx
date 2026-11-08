"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Textarea } from "@/components/ui";

interface EntryInstructionsDialogProps {
  bookingId: string;
  initialNotes: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Optional commercial scope editor when site access notes live there. */
  scopeHref?: string | null;
}

/**
 * View / edit entry instructions for THIS booking (persists via dashboard API).
 */
export function EntryInstructionsDialog({
  bookingId,
  initialNotes,
  open,
  onOpenChange,
  scopeHref,
}: EntryInstructionsDialogProps) {
  if (!open) return null;

  return (
    <EntryInstructionsDialogBody
      key={`${bookingId}:${initialNotes}`}
      bookingId={bookingId}
      initialNotes={initialNotes}
      onOpenChange={onOpenChange}
      scopeHref={scopeHref}
    />
  );
}

function EntryInstructionsDialogBody({
  bookingId,
  initialNotes,
  onOpenChange,
  scopeHref,
}: {
  bookingId: string;
  initialNotes: string;
  onOpenChange: (open: boolean) => void;
  scopeHref?: string | null;
}) {
  const router = useRouter();
  const [notes, setNotes] = useState(initialNotes);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/dashboard/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update_notes", notes }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(
          typeof payload.error === "string" ? payload.error : "Unable to save entry instructions.",
        );
      }
      onOpenChange(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save entry instructions.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-[#01193D]/40"
        aria-label="Close"
        onClick={() => onOpenChange(false)}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="entry-instructions-title"
        className="relative w-full max-w-md rounded-2xl border border-[#E2E8EE] bg-white p-5 shadow-[0_16px_48px_rgba(1,25,61,0.18)]"
        style={{ fontFamily: "var(--ml-font-ios)" }}
      >
        <h2
          id="entry-instructions-title"
          className="text-lg font-bold tracking-tight text-[#01193D]"
        >
          Entry instructions
        </h2>
        <p className="mt-1.5 text-sm text-[#5A6578]">
          Gate codes, parking, buzzer, pets — saved on this visit and shown to your cleaner.
        </p>

        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={5}
          maxLength={2000}
          placeholder="Buzzer, gate code, parking…"
          className="mt-4 rounded-xl border-[#D8DEE6] text-[15px] text-[#01193D]"
        />

        {scopeHref ? (
          <a
            href={scopeHref}
            className="mt-3 inline-flex text-sm font-semibold text-[#04CED2] underline-offset-2 hover:underline"
          >
            Edit site access notes
          </a>
        ) : null}

        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            variant="secondary"
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="rounded-xl"
          >
            Cancel
          </Button>
          <Button
            variant="accent"
            onClick={() => void handleSave()}
            disabled={loading}
            className="rounded-xl bg-[#04CED2] text-[#01193D] hover:bg-[#03b8bc]"
          >
            {loading ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>
    </div>
  );
}
