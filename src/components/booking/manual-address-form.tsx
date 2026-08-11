"use client";

import { useState } from "react";
import { Button, Input, Label } from "@/components/ui";
import type { BookingState } from "@/lib/bookings/booking-state";

type AddressPatch = Partial<
  Pick<
    BookingState,
    "line1" | "line2" | "city" | "state" | "postalCode" | "country" | "formattedAddress"
  >
>;

export function ManualAddressForm({
  value,
  onChange,
  onApply,
}: {
  value: AddressPatch;
  onChange: (patch: AddressPatch) => void;
  onApply: (patch: AddressPatch) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-xl border border-border bg-surface px-4 py-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium text-navy">Enter address manually</p>
          <p className="mt-1 text-sm text-ink-muted">
            Use this if map search is unavailable. Service area is checked from city, region, and
            postal code.
          </p>
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={() => setOpen((v) => !v)}>
          {open ? "Hide" : "Show"}
        </Button>
      </div>

      {open ? (
        <div className="mt-4 space-y-3">
          <div>
            <Label htmlFor="manual-line1">Street</Label>
            <Input
              id="manual-line1"
              value={value.line1 ?? ""}
              onChange={(e) => onChange({ line1: e.target.value })}
              placeholder="123 King St W"
            />
          </div>
          <div>
            <Label htmlFor="manual-line2">Unit (optional)</Label>
            <Input
              id="manual-line2"
              value={value.line2 ?? ""}
              onChange={(e) => onChange({ line2: e.target.value })}
              placeholder="Apt / suite"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="manual-city">City</Label>
              <Input
                id="manual-city"
                value={value.city ?? ""}
                onChange={(e) => onChange({ city: e.target.value })}
                placeholder="Toronto"
              />
            </div>
            <div>
              <Label htmlFor="manual-state">State / Province</Label>
              <Input
                id="manual-state"
                value={value.state ?? ""}
                onChange={(e) => onChange({ state: e.target.value.toUpperCase() })}
                placeholder="ON"
              />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="manual-postal">Postal code</Label>
              <Input
                id="manual-postal"
                value={value.postalCode ?? ""}
                onChange={(e) => onChange({ postalCode: e.target.value })}
                placeholder="M5V 1A1"
              />
            </div>
            <div>
              <Label htmlFor="manual-country">Country</Label>
              <Input
                id="manual-country"
                value={value.country ?? "CA"}
                onChange={(e) => onChange({ country: e.target.value.toUpperCase() })}
                placeholder="CA"
              />
            </div>
          </div>
          <Button
            type="button"
            className="w-full"
            onClick={() => {
              const formatted = [
                value.line1,
                value.line2,
                [value.city, value.state].filter(Boolean).join(", "),
                value.postalCode,
                value.country ?? "CA",
              ]
                .filter(Boolean)
                .join(", ");
              const patch: AddressPatch = {
                ...value,
                country: value.country ?? "CA",
                formattedAddress: formatted,
              };
              onChange(patch);
              onApply(patch);
            }}
          >
            Use this address
          </Button>
        </div>
      ) : null}
    </div>
  );
}
