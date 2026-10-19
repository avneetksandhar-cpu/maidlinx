"use client";

import { cn } from "@/lib/utils";

const TOTAL = 6;

export function ProgressBar({
  step,
  className,
}: {
  step: number;
  className?: string;
}) {
  const current = Math.min(Math.max(step, 1), TOTAL);
  return (
    <div className={cn("flex items-center justify-center gap-1", className)} aria-label={`Step ${current} of ${TOTAL}`}>
      {Array.from({ length: TOTAL }, (_, index) => (
        <span
          key={index}
          className={cn(
            "h-0.5 w-3 rounded-full",
            index + 1 <= current ? "bg-white" : "bg-white/20",
          )}
        />
      ))}
    </div>
  );
}
