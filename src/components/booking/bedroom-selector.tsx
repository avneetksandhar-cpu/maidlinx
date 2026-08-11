"use client";

import { Minus, Plus } from "lucide-react";
import { Label } from "@/components/ui";
import { cn } from "@/lib/utils";

interface StepperSelectorProps {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  error?: string;
  compact?: boolean;
}

export function StepperSelector({
  id,
  label,
  value,
  min,
  max,
  onChange,
  error,
  compact = false,
}: StepperSelectorProps) {
  return (
    <div>
      <Label htmlFor={id} className={compact ? "text-sm text-ink-muted" : undefined}>
        {label}
      </Label>
      <div
        className={cn(
          "mt-2 flex items-center justify-between rounded-xl border bg-surface transition-colors duration-150",
          compact ? "px-2 py-1.5" : "px-3 py-2.5",
          error ? "border-error" : "border-border",
        )}
      >
        <button
          type="button"
          aria-label={`Decrease ${label.toLowerCase()}`}
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          className={cn(
            "flex items-center justify-center rounded-lg text-ink transition-colors duration-150 hover:bg-surface-muted disabled:opacity-40",
            compact ? "size-10" : "size-11",
          )}
        >
          <Minus className="size-5" />
        </button>
        <span
          id={id}
          className={cn(
            "min-w-[2.5rem] text-center font-semibold tabular-nums text-ink",
            compact ? "text-xl" : "text-2xl",
          )}
        >
          {value}
        </span>
        <button
          type="button"
          aria-label={`Increase ${label.toLowerCase()}`}
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          className={cn(
            "flex items-center justify-center rounded-lg text-ink transition-colors duration-150 hover:bg-surface-muted disabled:opacity-40",
            compact ? "size-10" : "size-11",
          )}
        >
          <Plus className="size-5" />
        </button>
      </div>
      {error ? <p className="mt-2 text-sm text-error">{error}</p> : null}
    </div>
  );
}

export function BedroomSelector(
  props: Omit<StepperSelectorProps, "id" | "label" | "min" | "max">,
) {
  return (
    <StepperSelector id="bedrooms" label="Bedrooms" min={0} max={20} {...props} />
  );
}

export function BathroomSelector(
  props: Omit<StepperSelectorProps, "id" | "label" | "min" | "max">,
) {
  return (
    <StepperSelector id="bathrooms" label="Bathrooms" min={1} max={20} {...props} />
  );
}
