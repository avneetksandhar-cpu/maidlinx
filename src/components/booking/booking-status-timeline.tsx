"use client";

import { getCustomerTimelineState } from "@/lib/bookings/status-timeline";
import { cn } from "@/lib/utils";

interface BookingStatusTimelineProps {
  status: string;
  className?: string;
}

export function BookingStatusTimeline({ status, className }: BookingStatusTimelineProps) {
  const { steps } = getCustomerTimelineState(status);

  return (
    <ol className={cn("space-y-3", className)} aria-label="Booking progress">
      {steps.map((step) => (
        <li key={step.key} className="flex items-center gap-3 text-sm">
          <span
            className={cn(
              "flex size-2.5 shrink-0 rounded-full",
              step.state === "complete" && "bg-accent",
              step.state === "current" && "bg-accent ring-4 ring-accent/20",
              step.state === "upcoming" && "bg-border",
            )}
            aria-hidden
          />
          <span
            className={cn(
              step.state === "upcoming" ? "text-ink-muted" : "font-medium text-ink",
              step.state === "current" && "text-accent",
            )}
          >
            {step.label}
          </span>
        </li>
      ))}
    </ol>
  );
}
