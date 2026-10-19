import { TEST_CUSTOMER_EMAIL, TEST_LABEL } from "@/lib/test-fixtures/constants";

export function includeTestFixturesInHistory(email: string | null | undefined): boolean {
  return email === TEST_CUSTOMER_EMAIL;
}

export function historyLabel(isTestFixture: boolean): string | null {
  return isTestFixture ? TEST_LABEL : null;
}

export const PAID_RECEIPT_STATUSES = ["paid", "confirmed", "in_progress", "completed", "refunded"] as const;

export function isReceiptStatus(status: string): boolean {
  return (PAID_RECEIPT_STATUSES as readonly string[]).includes(status);
}

/** A printable receipt exists only when Stripe recorded a paid or refunded payment. */
export function hasPaidReceipt(args: {
  paymentStatus: string | null | undefined;
  amountCents: number | null | undefined;
}): boolean {
  if (args.amountCents == null || args.amountCents <= 0) return false;
  return args.paymentStatus === "paid" || args.paymentStatus === "refunded";
}
