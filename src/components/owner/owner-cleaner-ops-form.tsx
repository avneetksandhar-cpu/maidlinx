"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Label } from "@/components/ui";
import { ARRIVAL_WINDOWS } from "@/lib/bookings/constants";
import type { AvailabilitySlot } from "@/lib/pro/dashboard/availability";
import { DAY_LABELS } from "@/lib/pro/dashboard/display";
import type { OwnerCleanerOpsSnapshot } from "@/lib/owner/cleaner-ops";

const MARKET_OPTIONS = [
  { id: "TORONTO_GTA", label: "Toronto / GTA (CAD)" },
  { id: "SOUTH_FLORIDA", label: "South Florida (USD)" },
] as const;

export function OwnerCleanerOpsForm({
  initial,
}: {
  initial: OwnerCleanerOpsSnapshot;
}) {
  const router = useRouter();
  const [marketId, setMarketId] = useState(initial.capabilities?.marketId ?? "");
  const [serviceIds, setServiceIds] = useState(initial.capabilities?.serviceIds ?? []);
  const [zoneIds, setZoneIds] = useState(initial.capabilities?.zoneIds ?? []);
  const [hasVehicle, setHasVehicle] = useState(initial.capabilities?.hasVehicle ?? false);
  const [travelRadiusKm, setTravelRadiusKm] = useState(
    String(initial.capabilities?.travelRadiusKm ?? 25),
  );
  const [isOnline, setIsOnline] = useState(initial.isOnline);
  const [slots, setSlots] = useState<AvailabilitySlot[]>(initial.availability);
  const [blockedDates, setBlockedDates] = useState(
    initial.unavailableDates.map((d) => d.unavailableDate).join("\n"),
  );
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const zonesForMarket = useMemo(() => {
    if (!marketId) return [];
    return initial.zonesCatalog.filter((z) => z.marketId === marketId);
  }, [marketId, initial.zonesCatalog]);

  function toggle(list: string[], id: string, setter: (next: string[]) => void) {
    setter(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
  }

  function onMarketChange(next: string) {
    setMarketId(next);
    setZoneIds((prev) =>
      prev.filter(
        (id) => initial.zonesCatalog.find((z) => z.id === id)?.marketId === next,
      ),
    );
  }

  function toggleSlot(dayOfWeek: number, arrivalWindow: string) {
    setSlots((prev) =>
      prev.map((slot) =>
        slot.dayOfWeek === dayOfWeek && slot.arrivalWindow === arrivalWindow
          ? { ...slot, isAvailable: !slot.isAvailable }
          : slot,
      ),
    );
  }

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);
    if (!marketId) {
      setError("Select TORONTO_GTA or SOUTH_FLORIDA.");
      setLoading(false);
      return;
    }
    const unavailableDates = blockedDates
      .split(/[\n,]+/)
      .map((s) => s.trim())
      .filter((s) => /^\d{4}-\d{2}-\d{2}$/.test(s))
      .map((unavailableDate) => ({ unavailableDate }));

    try {
      const response = await fetch(`/api/owner/cleaners/${initial.cleanerId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          marketId,
          serviceIds,
          zoneIds,
          hasVehicle,
          travelRadiusKm: Number(travelRadiusKm),
          isOnline,
          slots,
          unavailableDates,
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Unable to save.");
      setMessage("Saved. Coverage will refresh on /owner/cleaners.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <section className="rounded-xl border border-border bg-surface p-4">
        <h2 className="font-display text-lg font-semibold text-ink">Market</h2>
        <p className="mt-1 text-sm text-ink-muted">
          One market only. Do not invent — enter the cleaner&apos;s real region.
        </p>
        <div className="mt-3 grid gap-2">
          {MARKET_OPTIONS.map((market) => (
            <label
              key={market.id}
              className="flex min-h-12 items-center gap-3 rounded-lg border border-border px-3 py-3 text-sm"
            >
              <input
                type="radio"
                name="market"
                checked={marketId === market.id}
                onChange={() => onMarketChange(market.id)}
                className="h-4 w-4 accent-teal"
              />
              <span className="text-ink">{market.label}</span>
            </label>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-border bg-surface p-4">
        <h2 className="font-display text-lg font-semibold text-ink">Services offered</h2>
        <div className="mt-3 grid gap-2">
          {initial.servicesCatalog.map((service) => (
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
      </section>

      <section className="rounded-xl border border-border bg-surface p-4">
        <h2 className="font-display text-lg font-semibold text-ink">Service zones</h2>
        {!marketId ? (
          <p className="mt-2 text-sm text-ink-muted">Select a market first.</p>
        ) : (
          <div className="mt-3 grid gap-2">
            {zonesForMarket.map((zone) => (
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
        )}
        <div className="mt-4">
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
        <label className="mt-3 flex min-h-12 items-center gap-3 text-sm text-ink">
          <input
            type="checkbox"
            checked={hasVehicle}
            onChange={(e) => setHasVehicle(e.target.checked)}
            className="h-4 w-4 accent-teal"
          />
          Has vehicle
        </label>
        <label className="mt-1 flex min-h-12 items-center gap-3 text-sm text-ink">
          <input
            type="checkbox"
            checked={isOnline}
            onChange={(e) => setIsOnline(e.target.checked)}
            className="h-4 w-4 accent-teal"
          />
          Online for auto-offers
        </label>
      </section>

      <section className="rounded-xl border border-border bg-surface p-4">
        <h2 className="font-display text-lg font-semibold text-ink">
          Recurring availability
        </h2>
        {!initial.availabilityPersisted ? (
          <p className="mt-1 text-sm text-amber-700">
            No availability rows saved yet — defaults shown. Save to persist for matching.
          </p>
        ) : (
          <p className="mt-1 text-sm text-ink-muted">
            Weekly windows used by marketplace eligibility.
          </p>
        )}
        <div className="mt-3 overflow-x-auto">
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
                      (s) =>
                        s.dayOfWeek === dayIndex && s.arrivalWindow === window.id,
                    );
                    const available = slot?.isAvailable ?? false;
                    return (
                      <td key={window.id} className="py-3 text-center">
                        <button
                          type="button"
                          onClick={() => toggleSlot(dayIndex, window.id)}
                          className={`min-h-10 min-w-16 rounded-md px-2 text-xs font-medium ${
                            available
                              ? "bg-emerald-600 text-white"
                              : "bg-surface-muted text-ink-muted"
                          }`}
                        >
                          {available ? "Open" : "Off"}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-surface p-4">
        <h2 className="font-display text-lg font-semibold text-ink">Unavailable dates</h2>
        <p className="mt-1 text-sm text-ink-muted">
          One YYYY-MM-DD per line (time off). Matching skips these days.
        </p>
        <textarea
          className="mt-3 min-h-28 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-ink"
          value={blockedDates}
          onChange={(e) => setBlockedDates(e.target.value)}
          placeholder={"2026-08-20\n2026-08-21"}
        />
      </section>

      {message ? <p className="text-sm text-success">{message}</p> : null}
      {error ? <p className="text-sm text-error">{error}</p> : null}

      <Button type="submit" variant="gold" size="lg" className="w-full" disabled={loading}>
        {loading ? "Saving…" : "Save cleaner ops"}
      </Button>
    </form>
  );
}
