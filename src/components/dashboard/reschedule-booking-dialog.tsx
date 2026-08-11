"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Input, Label } from "@/components/ui";
import { ARRIVAL_WINDOWS } from "@/lib/bookings/constants";

interface RescheduleBookingDialogProps {
  bookingId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function RescheduleBookingDialog({
  bookingId,
  open,
  onOpenChange,
  onSuccess,
}: RescheduleBookingDialogProps) {
  const router = useRouter();
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 2);
  const minDate = tomorrow.toISOString().slice(0, 10);

  const [date, setDate] = useState(minDate);
  const [arrivalWindow, setArrivalWindow] = useState<string>("morning");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  async function handleReschedule() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/dashboard/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reschedule", date, arrivalWindow }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to reschedule booking.");
      }

      onOpenChange(false);
      onSuccess?.();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to reschedule booking.");
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
        aria-labelledby="reschedule-title"
        className="relative w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-elevated"
      >
        <h2 id="reschedule-title" className="font-display text-lg font-semibold text-ink">
          Reschedule booking
        </h2>
        <p className="mt-2 text-sm text-ink-muted">
          Choose a new date and arrival window. Changes must be made at least 24 hours in advance.
        </p>

        <div className="mt-4 space-y-4">
          <div>
            <Label htmlFor="reschedule-date">New date</Label>
            <Input
              id="reschedule-date"
              type="date"
              min={minDate}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-2"
            />
          </div>
          <div>
            <Label>Arrival window</Label>
            <div className="mt-2 grid gap-2">
              {ARRIVAL_WINDOWS.map((window) => (
                <label
                  key={window.id}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 text-sm transition-colors ${
                    arrivalWindow === window.id
                      ? "border-accent bg-accent-muted"
                      : "border-border hover:bg-surface-muted"
                  }`}
                >
                  <input
                    type="radio"
                    name="arrivalWindow"
                    value={window.id}
                    checked={arrivalWindow === window.id}
                    onChange={() => setArrivalWindow(window.id)}
                    className="accent-gold"
                  />
                  <span>
                    <span className="font-medium text-ink">{window.label}</span>
                    <span className="ml-2 text-ink-muted">{window.description}</span>
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {error && <p className="mt-3 text-sm text-error">{error}</p>}

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button variant="gold" onClick={handleReschedule} disabled={loading}>
            {loading ? "Saving..." : "Save new time"}
          </Button>
        </div>
      </div>
    </div>
  );
}
