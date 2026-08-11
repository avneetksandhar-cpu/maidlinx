"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Textarea } from "@/components/ui";

interface CancelBookingDialogProps {
  bookingId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CancelBookingDialog({
  bookingId,
  open,
  onOpenChange,
  onSuccess,
}: CancelBookingDialogProps) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  async function handleCancel() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/dashboard/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel", reason: reason || undefined }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to cancel booking.");
      }

      onOpenChange(false);
      setReason("");
      onSuccess?.();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to cancel booking.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-ink/40"
        aria-label="Close"
        onClick={() => onOpenChange(false)}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="cancel-title"
        className="relative w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-elevated"
      >
        <h2 id="cancel-title" className="font-display text-lg font-semibold text-ink">
          Cancel booking
        </h2>
        <p className="mt-2 text-sm text-ink-muted">
          Bookings must be cancelled at least 24 hours before the scheduled time. Refunds are
          processed according to our cancellation policy.
        </p>
        <div className="mt-4">
          <label htmlFor="cancel-reason" className="text-sm font-medium text-ink">
            Reason (optional)
          </label>
          <Textarea
            id="cancel-reason"
            className="mt-2"
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Let us know why you're cancelling..."
          />
        </div>
        {error && <p className="mt-3 text-sm text-error">{error}</p>}
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={loading}>
            Keep booking
          </Button>
          <Button variant="primary" onClick={handleCancel} disabled={loading}>
            {loading ? "Cancelling..." : "Confirm cancellation"}
          </Button>
        </div>
      </div>
    </div>
  );
}
