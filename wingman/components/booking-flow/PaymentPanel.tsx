"use client";

import { cn } from "@/lib/utils";

const METHODS = [
  { id: "apple", label: "Apple Pay" },
  { id: "card", label: "Card" },
  { id: "google", label: "Google Pay" },
] as const;

export function PaymentPanel({
  selected,
  onSelect,
}: {
  selected: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="space-y-3">
      {METHODS.map((method) => (
        <button
          key={method.id}
          type="button"
          onClick={() => onSelect(method.id)}
          className={cn(
            "flex h-12 w-full items-center rounded-[16px] border px-4 text-left text-[16px] text-white",
            selected === method.id ? "border-[#00C2FF]/70 bg-white/[0.04]" : "border-white/10",
          )}
        >
          {method.label}
        </button>
      ))}
    </div>
  );
}
