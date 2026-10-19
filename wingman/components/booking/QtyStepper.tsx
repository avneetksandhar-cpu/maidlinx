"use client";

import { cn } from "@/lib/utils";

export function QtyStepper({
  value,
  min = 1,
  max = 8,
  onChange,
  tone = "light",
}: {
  value: number;
  min?: number;
  max?: number;
  onChange: (next: number) => void;
  tone?: "light" | "dark";
}) {
  const light = tone === "light";
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border",
        light ? "border-neutral-200 bg-neutral-50" : "border-white/15 bg-white/5",
      )}
    >
      <button
        type="button"
        aria-label="Decrease quantity"
        disabled={value <= min}
        onClick={() => onChange(Math.max(min, value - 1))}
        className={cn(
          "flex h-9 w-9 items-center justify-center text-lg disabled:opacity-30",
          light ? "text-neutral-900" : "text-white",
        )}
      >
        −
      </button>
      <span className={cn("min-w-6 text-center text-sm font-semibold", light ? "text-neutral-950" : "text-white")}>
        {value}
      </span>
      <button
        type="button"
        aria-label="Increase quantity"
        disabled={value >= max}
        onClick={() => onChange(Math.min(max, value + 1))}
        className={cn(
          "flex h-9 w-9 items-center justify-center text-lg disabled:opacity-30",
          light ? "text-neutral-900" : "text-white",
        )}
      >
        +
      </button>
    </div>
  );
}
