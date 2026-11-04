"use client";

import { Check } from "lucide-react";
import {
  getCustomerTimelineState,
  getDayOfTimelineState,
  getLiveJobTimelineState,
} from "@/lib/bookings/status-timeline";
import { cn } from "@/lib/utils";

interface BookingStatusTimelineProps {
  status: string;
  className?: string;
  /**
   * `customer` — Booked → Cleaner assigned → On the way → Complete
   * `live` — On the way → Arrived → Cleaning → Completed
   * `day_of` — Confirmed → On the way → Arrived → Cleaning → Complete
   */
  variant?: "customer" | "live" | "day_of";
  /** Optional detail under Cleaner assigned when a real Pro name exists. */
  assignedDetail?: string | null;
}

/* Prefer semantic tokens so light (ml-book) and dark (ml-dark) both resolve. */
const primary = "bg-[var(--color-accent,#04CED2)]";
const primaryText = "text-[var(--color-accent,#04CED2)]";
const ink = "text-[var(--color-ink,#ffffff)]";
const muted = "text-[var(--color-ink-muted,#b0bcc8)]";
const subtle = "text-[var(--color-ink-subtle,#8fa0b5)]";
const border = "bg-[var(--color-border,#1e4064)]";
const borderStrong = "bg-[var(--color-border-strong,#2a5478)]";
const selectedRing = "ring-[var(--color-accent-muted,rgb(4_206_210_/_0.2))]";
const checkFg = "text-[var(--color-accent-foreground,#01193D)]";
const primaryBorder = "border-[var(--color-accent,#04CED2)]";

export function BookingStatusTimeline({
  status,
  className,
  variant = "customer",
  assignedDetail,
}: BookingStatusTimelineProps) {
  if (variant === "live" || variant === "day_of") {
    const { steps } =
      variant === "day_of" ? getDayOfTimelineState(status) : getLiveJobTimelineState(status);

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
                    ? primary
                    : border,
                )}
                aria-hidden
              />
            ) : null}
            <span
              className={cn(
                "relative z-10 rounded-full transition-all",
                step.state === "complete" && cn("size-2.5", primary),
                step.state === "current" &&
                  cn("size-4 ring-4", primary, selectedRing),
                step.state === "upcoming" && cn("size-2.5", borderStrong),
              )}
              aria-current={step.state === "current" ? "step" : undefined}
              aria-hidden
            />
            <span
              className={cn(
                "mt-2 max-w-[4.75rem] text-[11px] leading-tight",
                step.state === "upcoming" && subtle,
                step.state === "complete" && cn("font-medium", muted),
                step.state === "current" && cn("font-semibold", primaryText),
              )}
            >
              {step.label}
            </span>
          </li>
        ))}
      </ol>
    );
  }

  const { steps } = getCustomerTimelineState(status);

  return (
    <ol className={cn("space-y-0", className)} aria-label="Booking progress">
      {steps.map((step, index) => {
        const done = step.state === "complete";
        const current = step.state === "current";
        const showDetail =
          step.key === "cleaner_assigned" && (done || current) && Boolean(assignedDetail);
        const isLast = index === steps.length - 1;
        const filled = done;

        return (
          <li key={step.key} className="relative flex gap-3 pb-5 last:pb-0">
            {!isLast ? (
              <span
                className={cn(
                  "absolute top-7 bottom-0 left-[0.8125rem] w-0.5",
                  done ? primary : border,
                )}
                aria-hidden
              />
            ) : null}
            <span
              className={cn(
                "relative z-10 flex size-7 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                filled && cn(primaryBorder, primary, checkFg),
                current &&
                  !filled &&
                  cn(primaryBorder, "bg-transparent text-transparent ring-4", selectedRing),
                !filled &&
                  !current &&
                  "border-[var(--color-border-strong,#2a5478)] bg-transparent text-transparent",
              )}
              aria-current={current ? "step" : undefined}
            >
              {filled ? <Check className="size-3.5" strokeWidth={3} aria-hidden /> : null}
            </span>
            <div className="min-w-0 pt-0.5">
              <p
                className={cn(
                  "text-[15px] font-semibold",
                  step.state === "upcoming" && muted,
                  done && ink,
                  current && primaryText,
                )}
              >
                {step.label}
              </p>
              {showDetail ? (
                <p className={cn("mt-0.5 text-sm", muted)}>{assignedDetail}</p>
              ) : null}
              {step.key === "cleaner_assigned" && current && !assignedDetail ? (
                <p className={cn("mt-0.5 text-sm", muted)}>Finding your cleaner</p>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
