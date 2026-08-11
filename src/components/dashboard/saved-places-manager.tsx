"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Card, CardContent, Input, Label } from "@/components/ui";
import { ADDRESS_LABEL_PRESETS } from "@/lib/addresses/types";
import type { SavedAddress } from "@/lib/addresses/types";
import { formatAddressSummary } from "@/lib/addresses/map";
import { GoogleMapsProvider } from "@/components/booking/google-maps-provider";
import { AddressAutocomplete } from "@/components/booking/address-autocomplete";
import type { Step1Address } from "@/lib/validations/booking-flow";
import { bookingToStructuredAddress } from "@/lib/addresses/map";

interface SavedPlacesManagerProps {
  initialAddresses: SavedAddress[];
}

export function SavedPlacesManager({ initialAddresses }: SavedPlacesManagerProps) {
  const router = useRouter();
  const [addresses, setAddresses] = useState(initialAddresses);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState<Partial<Step1Address>>({ country: "US" });
  const [label, setLabel] = useState("Home");
  const [customLabel, setCustomLabel] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [unitEdits, setUnitEdits] = useState<Record<string, string>>({});
  const [labelEdits, setLabelEdits] = useState<Record<string, string>>({});

  async function refreshFromServer() {
    const response = await fetch("/api/dashboard/addresses", { credentials: "include" });
    if (!response.ok) return;
    const payload = (await response.json()) as { data?: { addresses?: SavedAddress[] } };
    setAddresses(payload.data?.addresses ?? []);
    router.refresh();
  }

  async function handleCreate() {
    setError(null);
    const structured = bookingToStructuredAddress(draft);
    if (!structured) {
      setError("Select a Google address suggestion before saving.");
      return;
    }

    const finalLabel =
      label === "Other" ? customLabel.trim() || "Other" : label.trim() || "Home";

    setBusyId("new");
    try {
      const response = await fetch("/api/dashboard/addresses", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...structured,
          label: finalLabel,
          isDefault: addresses.length === 0,
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Unable to save place.");
      setAdding(false);
      setDraft({ country: "US" });
      setLabel("Home");
      setCustomLabel("");
      await refreshFromServer();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save place.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleSetDefault(id: string) {
    setBusyId(id);
    setError(null);
    try {
      const response = await fetch(`/api/dashboard/addresses/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ setDefault: true }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Unable to set default.");
      await refreshFromServer();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to set default.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleSaveMeta(id: string) {
    setBusyId(id);
    setError(null);
    try {
      const response = await fetch(`/api/dashboard/addresses/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: labelEdits[id]?.trim() || undefined,
          unit: unitEdits[id] !== undefined ? unitEdits[id] : undefined,
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Unable to update place.");
      await refreshFromServer();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update place.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(id: string) {
    setBusyId(id);
    setError(null);
    try {
      const response = await fetch(`/api/dashboard/addresses/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Unable to delete place.");
      await refreshFromServer();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete place.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-4">
      {error ? (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-error">{error}</p>
      ) : null}

      {addresses.map((address) => {
        const unitValue = unitEdits[address.id] ?? address.unit ?? "";
        const labelValue = labelEdits[address.id] ?? address.label;
        return (
          <Card key={address.id}>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-ink">
                    {address.label}
                    {address.isDefault ? (
                      <span className="ml-2 rounded-full bg-accent-muted px-2 py-0.5 text-xs font-medium text-accent">
                        Default
                      </span>
                    ) : null}
                  </p>
                  <p className="mt-1 text-sm text-ink-muted">{formatAddressSummary(address)}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {!address.isDefault ? (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      disabled={busyId === address.id}
                      onClick={() => void handleSetDefault(address.id)}
                    >
                      Set default
                    </Button>
                  ) : null}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={busyId === address.id}
                    onClick={() => void handleDelete(address.id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label htmlFor={`label-${address.id}`}>Label</Label>
                  <Input
                    id={`label-${address.id}`}
                    className="mt-1.5"
                    value={labelValue}
                    onChange={(e) =>
                      setLabelEdits((prev) => ({ ...prev, [address.id]: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor={`unit-${address.id}`}>Unit / Apt / Suite</Label>
                  <Input
                    id={`unit-${address.id}`}
                    className="mt-1.5"
                    value={unitValue}
                    onChange={(e) =>
                      setUnitEdits((prev) => ({ ...prev, [address.id]: e.target.value }))
                    }
                  />
                </div>
              </div>
              <Button
                type="button"
                size="sm"
                disabled={busyId === address.id}
                onClick={() => void handleSaveMeta(address.id)}
              >
                Save changes
              </Button>
            </CardContent>
          </Card>
        );
      })}

      {adding ? (
        <Card>
          <CardContent className="space-y-4">
            <p className="font-medium text-ink">Add a saved place</p>
            <div className="flex flex-wrap gap-2">
              {ADDRESS_LABEL_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  className={`rounded-full px-3 py-1.5 text-sm ${
                    label === preset
                      ? "bg-ink text-white"
                      : "bg-surface-muted text-ink-muted hover:text-ink"
                  }`}
                  onClick={() => setLabel(preset)}
                >
                  {preset}
                </button>
              ))}
            </div>
            {label === "Other" ? (
              <div>
                <Label htmlFor="custom-label">Custom label</Label>
                <Input
                  id="custom-label"
                  className="mt-1.5"
                  value={customLabel}
                  onChange={(e) => setCustomLabel(e.target.value)}
                  placeholder="e.g. Mom's house"
                />
              </div>
            ) : null}
            <GoogleMapsProvider>
              <AddressAutocomplete value={draft} onChange={setDraft} />
            </GoogleMapsProvider>
            <div className="flex gap-2">
              <Button
                type="button"
                disabled={busyId === "new"}
                onClick={() => void handleCreate()}
              >
                Save place
              </Button>
              <Button type="button" variant="ghost" onClick={() => setAdding(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Button type="button" onClick={() => setAdding(true)}>
          Add saved place
        </Button>
      )}
    </div>
  );
}
