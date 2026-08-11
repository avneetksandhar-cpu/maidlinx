"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Card, CardContent } from "@/components/ui";
import type { NotificationPreferences } from "@/lib/dashboard/notifications";

interface NotificationsFormProps {
  preferences: NotificationPreferences;
}

const TOGGLES = [
  {
    key: "emailBookingUpdates" as const,
    label: "Booking updates",
    description: "Confirmations, schedule changes, and cleaner assignments.",
  },
  {
    key: "emailPromotions" as const,
    label: "Promotions",
    description: "Seasonal offers and referral rewards.",
  },
  {
    key: "smsReminders" as const,
    label: "SMS reminders",
    description: "Day-before and arrival window reminders.",
  },
  {
    key: "pushEnabled" as const,
    label: "Push notifications",
    description: "Real-time updates in the MaidLinx app.",
  },
];

export function NotificationsForm({ preferences }: NotificationsFormProps) {
  const router = useRouter();
  const [values, setValues] = useState(preferences);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch("/api/dashboard/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section: "notifications", ...values }),
      });

      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Unable to save preferences.");

      setMessage("Notification preferences saved.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save preferences.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-1">
          {TOGGLES.map((toggle) => (
            <label
              key={toggle.key}
              className="flex cursor-pointer items-start justify-between gap-4 rounded-lg px-1 py-4 transition-colors hover:bg-surface-muted"
            >
              <span>
                <span className="block text-sm font-medium text-ink">{toggle.label}</span>
                <span className="mt-0.5 block text-sm text-ink-muted">{toggle.description}</span>
              </span>
              <input
                type="checkbox"
                checked={values[toggle.key]}
                onChange={(e) =>
                  setValues((prev) => ({ ...prev, [toggle.key]: e.target.checked }))
                }
                className="mt-1 h-5 w-5 shrink-0 accent-gold"
              />
            </label>
          ))}
          {message && <p className="pt-2 text-sm text-success">{message}</p>}
          {error && <p className="pt-2 text-sm text-error">{error}</p>}
          <Button type="submit" variant="gold" className="mt-4" disabled={loading}>
            {loading ? "Saving..." : "Save preferences"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
