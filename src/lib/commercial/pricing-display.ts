import type { BillingCadence, CommercialFrequency } from "@/lib/commercial/types";
import { frequencyLabel } from "@/lib/commercial/types";

/** Visits per average month from cadence — for estimate only, labeled as estimate. */
export function visitsPerMonthEstimate(frequency: CommercialFrequency | string): number {
  switch (frequency) {
    case "weekly":
      return 4;
    case "biweekly":
      return 2;
    case "monthly":
      return 1;
    case "one_time":
    case "custom":
    default:
      return 0;
  }
}

export function formatCents(cents: number, currency = "USD"): string {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(cents / 100);
  } catch {
    return `$${(cents / 100).toFixed(0)}`;
  }
}

export interface RecurringPriceBreakdown {
  visitCents: number;
  frequency: CommercialFrequency | string;
  billingCadence: BillingCadence | string;
  visitsPerMonth: number;
  monthlyEstimateCents: number | null;
  visitLabel: string;
  cadenceLabel: string;
  monthlyLabel: string | null;
}

/**
 * Full recurring price from a real proposal/order record.
 * Monthly line is an estimate (visit × typical visits/month) unless billing is already monthly.
 */
export function recurringPriceBreakdown(input: {
  visitCents: number;
  frequency: CommercialFrequency | string;
  billingCadence?: BillingCadence | string | null;
  currency?: string;
}): RecurringPriceBreakdown {
  const cadence = input.billingCadence ?? "per_visit";
  const visits = visitsPerMonthEstimate(input.frequency);
  const currency = input.currency ?? "USD";

  let monthlyEstimateCents: number | null = null;
  if (cadence === "monthly" && input.visitCents > 0) {
    // Some proposals store the monthly invoice amount in client_price_cents.
    monthlyEstimateCents = input.visitCents;
  } else if (visits > 0 && input.visitCents > 0) {
    monthlyEstimateCents = input.visitCents * visits;
  }

  const visitLabel =
    input.visitCents > 0
      ? `${formatCents(input.visitCents, currency)} / visit`
      : "Price pending quote";

  const cadenceLabel = frequencyLabel(String(input.frequency));

  let monthlyLabel: string | null = null;
  if (monthlyEstimateCents != null && monthlyEstimateCents > 0) {
    if (cadence === "monthly") {
      monthlyLabel = `${formatCents(monthlyEstimateCents, currency)} / month (billed monthly)`;
    } else if (input.frequency === "one_time") {
      monthlyLabel = null;
    } else {
      monthlyLabel = `≈ ${formatCents(monthlyEstimateCents, currency)} / month (${formatCents(input.visitCents, currency)} × ${visits} visits)`;
    }
  }

  return {
    visitCents: input.visitCents,
    frequency: input.frequency,
    billingCadence: cadence,
    visitsPerMonth: visits,
    monthlyEstimateCents,
    visitLabel,
    cadenceLabel,
    monthlyLabel,
  };
}
