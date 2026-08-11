"use client";

import { useEffect, useState, useTransition } from "react";
import { Button, Textarea } from "@/components/ui";

interface BookingReviewCardProps {
  bookingId: string;
}

export function BookingReviewCard({ bookingId }: BookingReviewCardProps) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [existing, setExisting] = useState<{ rating: number; comment: string | null } | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch(`/api/dashboard/reviews?bookingId=${encodeURIComponent(bookingId)}`);
        const json = (await res.json()) as {
          data?: { review?: { rating: number; comment: string | null } | null };
        };
        if (cancelled) return;
        if (json.data?.review) {
          setExisting(json.data.review);
          setDone(true);
        }
      } catch {
        // Auth may be required; form still allows submit attempt.
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [bookingId]);

  function submit() {
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch("/api/dashboard/reviews", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            bookingId,
            rating,
            comment: comment.trim() || undefined,
          }),
        });
        const json = (await res.json()) as { error?: string; data?: { review?: { id: string } } };
        if (!res.ok) {
          setError(json.error ?? "Unable to submit review.");
          return;
        }
        setDone(true);
        setExisting({ rating, comment: comment.trim() || null });
      } catch {
        setError("Unable to submit review.");
      }
    });
  }

  if (loading) {
    return (
      <section className="rounded-2xl border border-[var(--maidlinx-border)] bg-white p-4">
        <p className="text-sm text-[var(--maidlinx-muted)]">Checking review status…</p>
      </section>
    );
  }

  if (done && existing) {
    return (
      <section className="rounded-2xl border border-[var(--maidlinx-border)] bg-white p-4">
        <h2 className="font-display text-lg font-semibold text-[var(--maidlinx-ink)]">
          Thanks for your review
        </h2>
        <p className="mt-1 text-sm text-[var(--maidlinx-muted)]">
          You rated this clean {existing.rating}/5
          {existing.comment ? ` — “${existing.comment}”` : ""}.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-[var(--maidlinx-border)] bg-white p-4">
      <h2 className="font-display text-lg font-semibold text-[var(--maidlinx-ink)]">
        Rate your clean
      </h2>
      <p className="mt-1 text-sm text-[var(--maidlinx-muted)]">
        Help other customers — and your Pro — with an honest rating.
      </p>

      <div className="mt-4 flex flex-wrap gap-2" role="radiogroup" aria-label="Rating">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={rating === value}
            onClick={() => setRating(value)}
            className={
              rating === value
                ? "h-10 min-w-10 rounded-lg bg-[var(--maidlinx-green)] px-3 text-sm font-semibold text-white"
                : "h-10 min-w-10 rounded-lg border border-[var(--maidlinx-border)] bg-white px-3 text-sm font-medium text-[var(--maidlinx-ink)]"
            }
          >
            {value}
          </button>
        ))}
      </div>

      <div className="mt-4">
        <Textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Optional comments"
          rows={3}
          maxLength={2000}
        />
      </div>

      {error ? <p className="mt-2 text-sm text-red-700">{error}</p> : null}

      <Button className="mt-4 w-full" onClick={submit} disabled={pending}>
        {pending ? "Submitting…" : "Submit review"}
      </Button>
    </section>
  );
}
