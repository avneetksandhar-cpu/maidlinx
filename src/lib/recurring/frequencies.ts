/**
 * Recurring cadence — UI + architecture terms.
 * Stripe Subscriptions / auto-charge are NOT implemented.
 * Recurring discount rates are applied to first-clean totals via pricing engine.
 */

import { recurringDiscountOffPercent } from "@/lib/pricing/recurring-discount";

const weeklyOff = recurringDiscountOffPercent("weekly");
const biweeklyOff = recurringDiscountOffPercent("biweekly");
const monthlyOff = recurringDiscountOffPercent("monthly");

export const RECURRING_FREQUENCIES = [
  {
    id: "one_time" as const,
    label: "One time",
    description: "Book a single clean. Pay the deposit at checkout.",
  },
  {
    id: "weekly" as const,
    label: "Weekly",
    description: `Same day each week. ${weeklyOff}% off this clean — you confirm each visit (no automatic charges yet).`,
  },
  {
    id: "biweekly" as const,
    label: "Every 2 weeks",
    description: `Every other week. ${biweeklyOff}% off this clean — preference only until recurring billing ships.`,
  },
  {
    id: "monthly" as const,
    label: "Monthly",
    description: `Once a month. ${monthlyOff}% off this clean — preference only until recurring billing ships.`,
  },
] as const;

export type RecurringFrequencyId = (typeof RECURRING_FREQUENCIES)[number]["id"];

export const RECURRING_TERMS =
  "Recurring preference saves your cadence and applies the configured discount to this booking total. MaidLinx does not create automatic Stripe charges for weekly/biweekly/monthly plans yet. Cancel anytime from Support or your dashboard — no prepaid subscription.";

export function isRecurringCadence(
  value: string | null | undefined,
): value is Exclude<RecurringFrequencyId, "one_time"> {
  return value === "weekly" || value === "biweekly" || value === "monthly";
}
