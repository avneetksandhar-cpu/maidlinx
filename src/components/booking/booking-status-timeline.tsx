"use client";

import { Check } from "lucide-react";
import {
  getCustomerTimelineState,
  getLiveJobTimelineState,
} from "@/lib/bookings/status-timeline";
import { cn } from "@/lib/utils";

interface BookingStatusTimelineProps {
  status: string;
  className?: string;
  /**
   * `customer` — Booked → Cleaner assigned → On the way → Complete
   * `live` — On the way → Arrived → Cleaning → Completed
   */
  variant?: "customer" | "live";
  /** Optional detail under Cleaner assigned when a real Pro name exists. */
  assignedDetail?: string | null;
}

export function BookingStatusTimeline({
  status,
  className,
  variant = "customer",
  assignedDetail,
}: BookingStatusTimelineProps) {
  const { steps } =
    variant === "live" ? getLiveJobTimelineState(status) : getCustomerTimelineState(status);

  if (variant === "live") {
    return (
      <ol
        className={cn("flex w-full items-start justify-between gap-1", className)}
        aria-label="Booking progress"
      >
        {steps.map((step, index) => (
          <li key={step.key} className="relative flex flex-1 flex-col items-center text-center">
            {index > 0 ? (
              <span
                className={cn(
                  "absolute top-2.5 right-1/2 h-0.5 w-full -translate-y-1/2",
                  steps[index - 1]?.state === "complete" || steps[index - 1]?.state === "current"
                    ? "bg-[var(--ml-dark-mint)]"
                    : "bg-[var(--ml-dark-border)]",
                )}
                aria-hidden
              />
            ) : null}
            <span
              className={cn(
                "relative z-10 rounded-full transition-all",
                step.state === "complete" && "size-2.5 bg-[var(--ml-dark-mint)]",
                step.state === "current" &&
                  "size-4 bg-[var(--ml-dark-mint)] shadow-[0_0_16px_rgb(8_224_212_/_0.45)] ring-4 ring-[var(--ml-dark-mint)]/25",
                step.state === "upcoming" && "size-2.5 bg-[var(--ml-dark-border-strong)]",
              )}
              aria-current={step.state === "current" ? "step" : undefined}
              aria-hidden
            />
            <span
              className={cn(
                "mt-2 max-w-[4.75rem] text-[11px] leading-tight",
                step.state === "upcoming" && "text-[var(--ml-dark-ink-subtle)]",
                step.state === "complete" && "font-medium text-[var(--ml-dark-ink-muted)]",
                step.state === "current" && "font-semibold text-[var(--ml-dark-mint)]",
              )}
            >
              {step.label}
            </span>
          </li>
        ))}
      </ol>
    );
  }

  return (
    <ol className={cn("space-y-0", className)} aria-label="Booking progress">
      {steps.map((step, index) => {
        const done = step.state === "complete";
        const current = step.state === "current";
        const showDetail =
          step.key === "cleaner_assigned" &&
          (done || current) &&
          Boolean(assignedDetail);
        const isLast = index === steps.length - 1;
        // Filled check only when truly complete — "current" while finding stays outlined.
        const filled = done;

        return (
          <li key={step.key} className="relative flex gap-3 pb-5 last:pb-0">
            {!isLast ? (
              <span
                className={cn(
                  "absolute top-7 bottom-0 left-[0.8125rem] w-0.5",
                  done ? "bg-[var(--ml-dark-mint)]" : "bg-[var(--ml-dark-border)]",
                )}
                aria-hidden
              />
            ) : null}
            <span
              className={cn(
                "relative z-10 flex size-7 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                filled &&
                  "border-[var(--ml-dark-mint)] bg-[var(--ml-dark-mint)] text-[var(--color-accent-foreground)]",
                current &&
                  !filled &&
                  "border-[var(--ml-dark-mint)] bg-transparent text-transparent ring-4 ring-[var(--ml-dark-mint)]/20",
                !filled &&
                  !current &&
                  "border-[var(--ml-dark-border-strong)] bg-transparent text-transparent",
              )}
              aria-current={current ? "step" : undefined}
            >
              {filled ? <Check className="size-3.5" strokeWidth={3} aria-hidden /> : null}
            </span>
            <div className="min-w-0 pt-0.5">
              <p
                className={cn(
                  "text-[15px] font-semibold",
                  step.state === "upcoming" && "text-[var(--ml-dark-ink-muted)]",
                  done && "text-white",
                  current && "text-[var(--ml-dark-mint)]",
                )}
              >
                {step.label}
              </p>
              {showDetail ? (
                <p className="mt-0.5 text-sm text-[var(--ml-dark-ink-muted)]">{assignedDetail}</p>
              ) : null}
              {step.key === "cleaner_assigned" && current && !assignedDetail ? (
                <p className="mt-0.5 text-sm text-[var(--ml-dark-ink-muted)]">
                  Finding your MaidLinx Pro…
                </p>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
