"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Card, CardContent } from "@/components/ui";
import { ARRIVAL_WINDOWS } from "@/lib/bookings/constants";
import type { AvailabilitySlot } from "@/lib/pro/dashboard/availability";
import { DAY_LABELS } from "@/lib/pro/dashboard/display";

interface AvailabilityCalendarProps {
  initialSlots: AvailabilitySlot[];
}

export function AvailabilityCalendar({ initialSlots }: AvailabilityCalendarProps) {
  const router = useRouter();
  const [slots, setSlots] = useState(initialSlots);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  function toggleSlot(dayOfWeek: number, arrivalWindow: string) {
    setSlots((prev) =>
      prev.map((slot) =>
        slot.dayOfWeek === dayOfWeek && slot.arrivalWindow === arrivalWindow
          ? { ...slot, isAvailable: !slot.isAvailable }
          : slot,
      ),
    );
  }

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    try {
      const response = await fetch("/api/cleaner/availability", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slots }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Unable to save.");
      setMessage("Availability updated.");
      router.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Unable to save.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardContent className="space-y-4">
        <p className="text-sm text-ink-muted">
          Set when you are available to accept jobs. Customers book within these windows.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] text-sm">
            <thead>
              <tr>
                <th className="pb-3 text-left font-medium text-ink-muted">Day</th>
                {ARRIVAL_WINDOWS.map((window) => (
                  <th key={window.id} className="pb-3 text-center font-medium text-ink-muted">
                    {window.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DAY_LABELS.map((dayLabel, dayIndex) => (
                <tr key={dayLabel} className="border-t border-border">
                  <td className="py-3 font-medium text-ink">{dayLabel}</td>
                  {ARRIVAL_WINDOWS.map((window) => {
                    const slot = slots.find(
                      (s) => s.dayOfWeek === dayIndex && s.arrivalWindow === window.id,
                    );
                    const available = slot?.isAvailable ?? false;
                    return (
                      <td key={window.id} className="py-3 text-center">
                        <button
                          type="button"
                          onClick={() => toggleSlot(dayIndex, window.id)}
                          className={`mx-auto flex h-10 w-10 items-center justify-center rounded-lg border transition-colors ${
                            available
                              ? "border-gold bg-gold-muted text-gold"
                              : "border-border bg-surface-muted text-ink-subtle hover:border-border-strong"
                          }`}
                          aria-label={`${dayLabel} ${window.label} ${available ? "available" : "unavailable"}`}
                        >
                          {available ? "✓" : "—"}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {message && (
          <p className={`text-sm ${message.includes("updated") ? "text-success" : "text-error"}`}>
            {message}
          </p>
        )}

        <Button variant="gold" onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save availability"}
        </Button>
      </CardContent>
    </Card>
  );
}
