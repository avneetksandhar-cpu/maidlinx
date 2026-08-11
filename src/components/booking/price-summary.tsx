"use client";

import type { PriceBreakdown } from "@/lib/pricing/types";
import { calculateDepositCents, getDepositPercent } from "@/lib/payments/deposit";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";

interface PriceSummaryProps {
  pricing: PriceBreakdown | null;
  loading?: boolean;
  isServerVerified?: boolean;
  onContinue?: () => void;
  continueLabel?: string;
  continueDisabled?: boolean;
  variant?: "sidebar" | "embedded" | "mobile";
  showDeposit?: boolean;
  className?: string;
}

function formatDuration(minutes?: number): string {
  if (!minutes) return "—";
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins} min`;
  if (mins === 0) return `${hours} hr`;
  return `${hours} hr ${mins} min`;
}

function BreakdownRows({ pricing }: { pricing: PriceBreakdown }) {
  const feesCents = pricing.feesCents ?? pricing.platformFeeCents;
  const taxCents = pricing.taxCents ?? 0;
  const discountCents = pricing.discountCents ?? 0;
  const currency = pricing.currency;

  if (pricing.quoteOnly) {
    return (
      <div className="space-y-3 text-sm">
        <div className="flex justify-between gap-4">
          <span className="text-ink-muted">Service</span>
          <span className="font-medium">{pricing.serviceLabel ?? "Custom"}</span>
        </div>
        <p className="rounded-xl bg-surface-muted px-3 py-2 text-ink-muted">
          Quote-based pricing — we&apos;ll confirm your total before charging.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3 text-sm">
      <div className="flex justify-between gap-4">
        <span className="text-ink-muted">Service</span>
        <span className="font-medium">{pricing.serviceLabel ?? "Cleaning"}</span>
      </div>
      <div className="flex justify-between gap-4">
        <span className="text-ink-muted">Base</span>
        <span className="font-medium tabular-nums">
          {formatCurrency(pricing.baseCents + pricing.bedroomCents + pricing.bathroomCents + pricing.squareFootageCents, currency)}
        </span>
      </div>
      <div className="flex justify-between gap-4">
        <span className="text-ink-muted">Extras</span>
        <span className="font-medium tabular-nums">
          {formatCurrency(pricing.extrasCents, currency)}
        </span>
      </div>
      <div className="flex justify-between gap-4">
        <span className="text-ink-muted">Fees</span>
        <span className="font-medium tabular-nums">{formatCurrency(feesCents, currency)}</span>
      </div>
      <div className="flex justify-between gap-4">
        <span className="text-ink-muted">Tax</span>
        <span className="font-medium tabular-nums">{formatCurrency(taxCents, currency)}</span>
      </div>
      <div className="flex justify-between gap-4">
        <span className="text-ink-muted">Discount</span>
        <span className="font-medium tabular-nums">
          {discountCents > 0 ? `−${formatCurrency(discountCents, currency)}` : formatCurrency(0, currency)}
        </span>
      </div>
    </div>
  );
}

export function PriceSummary({
  pricing,
  loading,
  isServerVerified = false,
  onContinue,
  continueLabel = "Continue",
  continueDisabled = false,
  variant = "sidebar",
  showDeposit = false,
  className,
}: PriceSummaryProps) {
  const content = (
    <>
      <div className="mb-5">
        <h3 className="font-display text-xl font-semibold tracking-tight text-ink">
          {pricing?.quoteOnly ? "Quote request" : "Estimated price"}
        </h3>
        {!loading && isServerVerified ? (
          <p className="mt-1 text-xs font-medium text-accent">
            {pricing?.quoteOnly ? "Details verified" : "Verified estimate"}
          </p>
        ) : pricing ? (
          <p className="mt-1 text-xs text-ink-muted">Updating…</p>
        ) : null}
      </div>

      {loading && !pricing ? (
        <p className="text-sm text-ink-muted">Calculating…</p>
      ) : pricing ? (
        <>
          <BreakdownRows pricing={pricing} />
          <div className="mt-5 flex items-end justify-between gap-4 border-t border-border/80 pt-5">
            <div>
              <p className="text-sm text-ink-muted">Total</p>
              <p className="font-display text-3xl font-semibold tracking-tight text-ink">
                {pricing.quoteOnly
                  ? "Custom quote"
                  : formatCurrency(pricing.totalCents, pricing.currency)}
              </p>
            </div>
            <div className="text-right text-sm">
              <p className="text-ink-muted">Est. duration</p>
              <p className="font-semibold text-ink">
                {formatDuration(pricing.estimatedDurationMinutes)}
              </p>
            </div>
          </div>
          {showDeposit && !pricing.quoteOnly ? (
            <div className="mt-5 rounded-xl bg-surface-muted px-4 py-3">
              <div className="flex justify-between gap-4 text-sm">
                <span className="text-ink-muted">Deposit today ({getDepositPercent()}%)</span>
                <span className="font-semibold tabular-nums">
                  {formatCurrency(calculateDepositCents(pricing.totalCents), pricing.currency)}
                </span>
              </div>
            </div>
          ) : null}
        </>
      ) : (
        <p className="text-sm leading-relaxed text-ink-muted">
          Enter your address and service details to see a live estimate.
        </p>
      )}

      {onContinue && variant !== "mobile" ? (
        <Button
          type="button"
          variant="accent"
          size="lg"
          className="mt-6 w-full rounded-xl text-base font-semibold"
          onClick={onContinue}
          disabled={continueDisabled || loading || !pricing}
        >
          {continueLabel}
        </Button>
      ) : null}
    </>
  );

  if (variant === "embedded") {
    return (
      <div className={cn("rounded-2xl bg-surface-muted/80 p-5", className)}>{content}</div>
    );
  }

  if (variant === "mobile") {
    return <div className={cn("px-1 py-2", className)}>{content}</div>;
  }

  return (
    <aside
      className={cn(
        "sticky top-24 rounded-xl border border-border bg-surface p-6 shadow-soft",
        className,
      )}
    >
      {content}
    </aside>
  );
}
