"use client";

import { cn } from "@/lib/utils";

export function SelectionCard({
  selected,
  onSelect,
  title,
  subtitle,
  className,
}: {
  selected: boolean;
  onSelect: () => void;
  title: string;
  subtitle?: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex min-h-14 w-full items-center rounded-[16px] border px-4 py-3.5 text-left transition-colors duration-200",
        selected ? "border-[#00C2FF]/70 bg-white/[0.04]" : "border-white/10 bg-transparent",
        className,
      )}
    >
      <span className="min-w-0 flex-1">
        <span className="block text-[16px] font-medium text-white">{title}</span>
        {subtitle ? <span className="mt-1 block text-[13px] leading-5 text-white/45">{subtitle}</span> : null}
      </span>
    </button>
  );
}
