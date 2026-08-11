"use client";

import { Check } from "lucide-react";
import { BOOKING_SERVICES } from "@/lib/bookings/constants";
import { getServicesForTile, type ServiceTileKey } from "@/config/services";
import type { BookingFormState } from "@/lib/validations/booking-flow";
import { cn } from "@/lib/utils";

interface CleaningTypeSelectorProps {
  value?: BookingFormState["serviceType"];
  onChange: (serviceType: BookingFormState["serviceType"]) => void;
  error?: string;
  hideLegend?: boolean;
  tileKey?: ServiceTileKey | null;
}

export function CleaningTypeSelector({
  value,
  onChange,
  error,
  hideLegend = false,
  tileKey,
}: CleaningTypeSelectorProps) {
  const marketplace = tileKey ? getServicesForTile(tileKey) : null;
  const services = marketplace?.length
    ? marketplace.map((s) => ({
        id: s.legacyServiceType,
        label: s.name,
        description: s.description,
      }))
    : BOOKING_SERVICES.filter((s) =>
        ["standard", "deep", "move_in", "move_out", "office", "airbnb_turnover"].includes(s.id),
      );

  return (
    <fieldset>
      {!hideLegend ? (
        <legend className="mb-3 block text-sm font-medium text-ink-muted">Cleaning type</legend>
      ) : null}
      <div className="grid gap-2.5">
        {services.map((service) => {
          const selected = value === service.id;
          return (
            <button
              key={service.id}
              type="button"
              onClick={() => onChange(service.id as BookingFormState["serviceType"])}
              aria-pressed={selected}
              data-selected={selected}
              className="booking-select-card items-start"
            >
              <span className="min-w-0 flex-1">
                <span className="block text-base font-semibold text-ink">{service.label}</span>
                <span className="mt-0.5 block text-sm leading-snug text-ink-muted">
                  {service.description}
                </span>
              </span>
              <span
                className={cn(
                  "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors duration-150",
                  selected
                    ? "border-accent bg-accent text-white"
                    : "border-border bg-surface text-transparent",
                )}
                aria-hidden
              >
                <Check className="size-3.5" strokeWidth={3} />
              </span>
            </button>
          );
        })}
      </div>
      {error ? <p className="mt-2 text-sm text-error">{error}</p> : null}
    </fieldset>
  );
}
