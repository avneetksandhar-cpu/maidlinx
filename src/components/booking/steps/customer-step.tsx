"use client";

import { useEffect, useState } from "react";
import type { BookingFormState } from "@/lib/validations/booking-flow";
import { ADDRESS_LABEL_PRESETS } from "@/lib/addresses/types";
import { Heading, Input, Label } from "@/components/ui";
import { cn } from "@/lib/utils";

type CustomerFormState = BookingFormState & {
  saveAddressForNextTime?: boolean;
  saveAddressLabel?: string;
};

interface CustomerStepProps {
  form: CustomerFormState;
  onChange: (value: Partial<CustomerFormState>) => void;
  errors: Record<string, string>;
  showTitle?: boolean;
}

function SaveAddressLabelFields({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const isNamedPreset = value === "Home" || value === "Work";
  const selectedPreset = isNamedPreset ? value : "Other";
  const customValue = isNamedPreset || value === "Other" ? "" : value;

  return (
    <div className="space-y-2">
      <Label className="text-xs text-ink-muted">Label</Label>
      <div className="flex flex-wrap gap-2">
        {ADDRESS_LABEL_PRESETS.map((preset) => {
          const selected = selectedPreset === preset;
          return (
            <button
              key={preset}
              type="button"
              onClick={() => onChange(preset === "Other" ? customValue || "Other" : preset)}
              aria-pressed={selected}
              className={cn(
                "min-h-10 rounded-xl border px-3.5 text-sm font-medium transition-colors",
                selected
                  ? "border-accent bg-accent-muted text-ink"
                  : "border-border bg-surface text-ink-muted hover:border-border-strong",
              )}
            >
              {preset}
            </button>
          );
        })}
      </div>
      {selectedPreset === "Other" ? (
        <Input
          id="saveAddressLabel"
          value={customValue}
          onChange={(e) => onChange(e.target.value.trim() ? e.target.value : "Other")}
          placeholder="Custom label"
          className="rounded-xl"
        />
      ) : null}
    </div>
  );
}

export function CustomerStep({ form, onChange, errors, showTitle = true }: CustomerStepProps) {
  const [canSaveAddress, setCanSaveAddress] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const response = await fetch("/api/dashboard/addresses", { credentials: "include" });
        if (!cancelled) setCanSaveAddress(response.ok);
      } catch {
        if (!cancelled) setCanSaveAddress(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div>
      {showTitle ? (
        <>
          <Heading as="h2" className="text-2xl">
            Your details
          </Heading>
          <p className="mt-2 text-sm text-ink-muted">
            We&apos;ll send confirmation and updates to this contact.
          </p>
        </>
      ) : null}
      <div className={`grid gap-5 sm:grid-cols-2 ${showTitle ? "mt-6" : ""}`}>
        <div>
          <Label htmlFor="firstName" className="text-sm text-ink-muted">
            First name
          </Label>
          <Input
            id="firstName"
            value={form.firstName ?? ""}
            onChange={(e) => onChange({ firstName: e.target.value })}
            invalid={Boolean(errors.firstName)}
            className="booking-input-lg mt-2 rounded-xl"
          />
          {errors.firstName ? (
            <p className="mt-2 text-sm text-error">{errors.firstName}</p>
          ) : null}
        </div>
        <div>
          <Label htmlFor="lastName" className="text-sm text-ink-muted">
            Last name
          </Label>
          <Input
            id="lastName"
            value={form.lastName ?? ""}
            onChange={(e) => onChange({ lastName: e.target.value })}
            invalid={Boolean(errors.lastName)}
            className="booking-input-lg mt-2 rounded-xl"
          />
          {errors.lastName ? (
            <p className="mt-2 text-sm text-error">{errors.lastName}</p>
          ) : null}
        </div>
      </div>
      <div className="mt-5">
        <Label htmlFor="email" className="text-sm text-ink-muted">
          Email
        </Label>
        <Input
          id="email"
          type="email"
          value={form.email ?? ""}
          onChange={(e) => onChange({ email: e.target.value })}
          invalid={Boolean(errors.email)}
          className="booking-input-lg mt-2 rounded-xl"
        />
        {errors.email ? <p className="mt-2 text-sm text-error">{errors.email}</p> : null}
      </div>
      <div className="mt-5">
        <Label htmlFor="phone" className="text-sm text-ink-muted">
          Phone
        </Label>
        <Input
          id="phone"
          type="tel"
          value={form.phone ?? ""}
          onChange={(e) => onChange({ phone: e.target.value })}
          invalid={Boolean(errors.phone)}
          placeholder="+14155552671"
          className="booking-input-lg mt-2 rounded-xl"
        />
        {errors.phone ? <p className="mt-2 text-sm text-error">{errors.phone}</p> : null}
      </div>

      {canSaveAddress ? (
        <div className="mt-6 space-y-3 rounded-xl border border-border bg-surface-muted/50 px-4 py-3">
          <label className="flex items-start gap-3 text-sm text-ink">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 rounded border-border text-accent focus:ring-accent/30"
              checked={Boolean(form.saveAddressForNextTime)}
              onChange={(event) =>
                onChange({ saveAddressForNextTime: event.target.checked })
              }
            />
            <span>
              Save this address for next time
              <span className="mt-0.5 block text-xs text-ink-muted">
                Appears as a Saved place on your next booking.
              </span>
            </span>
          </label>
          {form.saveAddressForNextTime ? (
            <SaveAddressLabelFields
              value={form.saveAddressLabel ?? "Home"}
              onChange={(saveAddressLabel) => onChange({ saveAddressLabel })}
            />
          ) : null}
        </div>
      ) : (
        <p className="mt-6 text-xs text-ink-subtle">
          Guest checkout is available without an account. Sign in later to save this address.
        </p>
      )}
    </div>
  );
}
