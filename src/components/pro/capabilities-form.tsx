"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Card, CardContent, Input, Label } from "@/components/ui";

interface CapabilitiesFormProps {
  initialServiceIds: string[];
  initialZoneIds: string[];
  hasVehicle: boolean;
  travelRadiusKm: number | null;
  services: Array<{ id: string; name: string; category: string }>;
  zones: Array<{ id: string; name: string; marketId: string }>;
  payoutStatus: "not_connected" | "pending" | "ready";
}

export function CapabilitiesForm({
  initialServiceIds,
  initialZoneIds,
  hasVehicle: initialHasVehicle,
  travelRadiusKm: initialRadius,
  services,
  zones,
  payoutStatus,
}: CapabilitiesFormProps) {
  const router = useRouter();
  const [serviceIds, setServiceIds] = useState(initialServiceIds);
  const [zoneIds, setZoneIds] = useState(initialZoneIds);
  const [hasVehicle, setHasVehicle] = useState(initialHasVehicle);
  const [travelRadiusKm, setTravelRadiusKm] = useState(
    initialRadius?.toString() ?? "25",
  );
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function toggle(list: string[], id: string, setter: (next: string[]) => void) {
    setter(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
  }

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);
    try {
      const response = await fetch("/api/cleaner/capabilities", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceIds,
          zoneIds,
          hasVehicle,
          travelRadiusKm: Number(travelRadiusKm),
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Unable to save.");
      setMessage("Services and zones saved.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSave} className="space-y-4">
      <Card>
        <CardContent className="space-y-3">
          <div>
            <h3 className="font-display text-lg font-semibold text-navy">Services offered</h3>
            <p className="mt-1 text-sm text-ink-muted">
              Only matching available jobs will show in your feed.
            </p>
          </div>
          <div className="grid gap-2">
            {services.map((service) => (
              <label
                key={service.id}
                className="flex min-h-12 items-center gap-3 rounded-lg border border-border px-3 py-3 text-sm"
              >
                <input
                  type="checkbox"
                  checked={serviceIds.includes(service.id)}
                  onChange={() => toggle(serviceIds, service.id, setServiceIds)}
                  className="h-4 w-4 accent-teal"
                />
                <span className="text-ink">{service.name}</span>
              </label>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-3">
          <div>
            <h3 className="font-display text-lg font-semibold text-navy">Service zones</h3>
            <p className="mt-1 text-sm text-ink-muted">
              Choose the areas where you take jobs.
            </p>
          </div>
          <div className="grid gap-2">
            {zones.map((zone) => (
              <label
                key={zone.id}
                className="flex min-h-12 items-center gap-3 rounded-lg border border-border px-3 py-3 text-sm"
              >
                <input
                  type="checkbox"
                  checked={zoneIds.includes(zone.id)}
                  onChange={() => toggle(zoneIds, zone.id, setZoneIds)}
                  className="h-4 w-4 accent-teal"
                />
                <span className="text-ink">{zone.name}</span>
              </label>
            ))}
          </div>
          <div>
            <Label htmlFor="travel-radius">Travel radius (km)</Label>
            <Input
              id="travel-radius"
              type="number"
              min={5}
              max={100}
              value={travelRadiusKm}
              onChange={(e) => setTravelRadiusKm(e.target.value)}
              className="mt-2"
            />
          </div>
          <label className="flex min-h-12 items-center gap-3 text-sm text-ink">
            <input
              type="checkbox"
              checked={hasVehicle}
              onChange={(e) => setHasVehicle(e.target.checked)}
              className="h-4 w-4 accent-teal"
            />
            I have a vehicle for travel
          </label>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <h3 className="font-display text-lg font-semibold text-navy">Payout status</h3>
          <p className="mt-2 text-sm text-ink-muted">
            {payoutStatus === "ready"
              ? "Stripe Connect linked — ready for payouts."
              : "Not connected yet. Contact MaidLinx support to finish payout setup."}
          </p>
        </CardContent>
      </Card>

      {message && <p className="text-sm text-success">{message}</p>}
      {error && <p className="text-sm text-error">{error}</p>}

      <Button type="submit" variant="gold" size="lg" className="w-full" disabled={loading}>
        {loading ? "Saving…" : "Save capabilities"}
      </Button>
    </form>
  );
}
