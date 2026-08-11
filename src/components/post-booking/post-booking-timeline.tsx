"use client";

import { getCustomerTimelineState } from "@/lib/bookings/status-timeline";
import { cn } from "@/lib/utils";

interface PostBookingTimelineProps {
  status: string;
  className?: string;
}

/** Horizontal Booked → Confirmed → On the way → Cleaning → Complete stepper. */
export function PostBookingTimeline({ status, className }: PostBookingTimelineProps) {
  const { steps } = getCustomerTimelineState(status);

  return (
    <ol
      className={cn("flex w-full items-start justify-between gap-1", className)}
      aria-label="Booking progress"
    >
      {steps.map((step, index) => {
        const prevComplete =
          index === 0 ? true : steps[index - 1]?.state === "complete" || steps[index - 1]?.state === "current";
        const lineComplete = step.state === "complete" || step.state === "current";

        return (
          <li key={step.key} className="relative flex flex-1 flex-col items-center text-center">
            {index > 0 ? (
              <span
                className={cn(
                  "absolute top-3 right-1/2 h-0.5 w-full -translate-y-1/2",
                  prevComplete && lineComplete ? "bg-[var(--maidlinx-green)]" : "bg-[var(--maidlinx-border)]",
                  steps[index - 1]?.state === "complete" ? "bg-[var(--maidlinx-green)]" : null,
                )}
                aria-hidden
              />
            ) : null}
            <span
              className={cn(
                "relative z-10 flex size-6 items-center justify-center rounded-full text-[10px] font-bold",
                step.state === "complete" && "bg-[var(--maidlinx-green)] text-white",
                step.state === "current" &&
                  "size-7 bg-[var(--maidlinx-green)] text-white ring-4 ring-[var(--maidlinx-mint)]",
                step.state === "upcoming" && "border-2 border-[var(--maidlinx-border)] bg-white text-transparent",
              )}
              aria-current={step.state === "current" ? "step" : undefined}
            >
              {step.state === "complete" ? "✓" : step.state === "current" ? "•" : ""}
            </span>
            <span
              className={cn(
                "mt-2 max-w-[4.5rem] text-[11px] leading-tight",
                step.state === "upcoming"
                  ? "text-[var(--maidlinx-muted)]"
                  : "font-medium text-[var(--maidlinx-ink)]",
                step.state === "current" && "text-[var(--maidlinx-green)]",
              )}
            >
              {step.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
