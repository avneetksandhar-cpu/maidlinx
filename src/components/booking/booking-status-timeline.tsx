"use client";

import {
  getCustomerTimelineState,
  getLiveJobTimelineState,
} from "@/lib/bookings/status-timeline";
import { cn } from "@/lib/utils";

interface BookingStatusTimelineProps {
  status: string;
  className?: string;
  /**
   * `customer` — Booked → Confirmed → On the way → Cleaning → Complete
   * `live` — On the way → Arrived → Cleaning → Completed (design-spec screens 8–10)
   */
  variant?: "customer" | "live";
}

export function BookingStatusTimeline({
  status,
  className,
  variant = "customer",
}: BookingStatusTimelineProps) {
  const { steps } =
    variant === "live" ? getLiveJobTimelineState(status) : getCustomerTimelineState(status);

  return (
    <ol
      className={cn(
        variant === "live"
          ? "flex w-full items-start justify-between gap-1"
          : "space-y-3",
        className,
      )}
      aria-label="Booking progress"
    >
      {steps.map((step, index) =>
        variant === "live" ? (
          <li key={step.key} className="relative flex flex-1 flex-col items-center text-center">
            {index > 0 ? (
              <span
                className={cn(
                  "absolute top-2.5 right-1/2 h-0.5 w-full -translate-y-1/2",
                  steps[index - 1]?.state === "complete" || steps[index - 1]?.state === "current"
                    ? "bg-accent"
                    : "bg-border",
                )}
                aria-hidden
              />
            ) : null}
            <span
              className={cn(
                "relative z-10 rounded-full transition-all",
                step.state === "complete" && "size-2.5 bg-accent",
                step.state === "current" &&
                  "size-4 bg-accent shadow-[0_0_16px_rgb(8_224_212_/_0.45)] ring-4 ring-accent/25",
                step.state === "upcoming" && "size-2.5 bg-border-strong",
              )}
              aria-current={step.state === "current" ? "step" : undefined}
              aria-hidden
            />
            <span
              className={cn(
                "mt-2 max-w-[4.75rem] text-[11px] leading-tight",
                step.state === "upcoming" && "text-ink-subtle",
                step.state === "complete" && "font-medium text-ink-muted",
                step.state === "current" && "font-semibold text-accent",
              )}
            >
              {step.label}
            </span>
          </li>
        ) : (
          <li key={step.key} className="flex items-center gap-3 text-sm">
            <span
              className={cn(
                "flex size-2.5 shrink-0 rounded-full",
                step.state === "complete" && "bg-accent",
                step.state === "current" && "bg-accent ring-4 ring-accent/25",
                step.state === "upcoming" && "bg-border-strong",
              )}
              aria-hidden
            />
            <span
              className={cn(
                step.state === "upcoming" && "text-ink-muted",
                step.state === "complete" && "font-medium text-ink",
                step.state === "current" && "font-medium text-accent",
              )}
            >
              {step.label}
            </span>
          </li>
        ),
      )}
    </ol>
  );
}
