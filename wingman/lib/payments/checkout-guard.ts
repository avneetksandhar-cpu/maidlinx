import type { RequestStatus } from "@/lib/marketplace/constants";
import { paymentUnlocked } from "@/lib/marketplace/request-machine";

export const PAID_OR_LATER: RequestStatus[] = [
  "paid",
  "confirmed",
  "in_progress",
  "completed",
  "refunded",
  "disputed",
];

export function assertServerPrice(args: {
  quoteTotalCents: number;
  clientAmountCents?: number | null;
}): void {
  if (args.clientAmountCents == null) return;
  if (!Number.isFinite(args.clientAmountCents)) {
    throw new Error("Client price is invalid. Server quote total is authoritative.");
  }
  if (Math.round(args.clientAmountCents) !== args.quoteTotalCents) {
    throw new Error("Client price does not match the server quote. Checkout blocked.");
  }
}

export function assertCheckoutAllowed(args: {
  status: RequestStatus;
  existingPaid: boolean;
}): void {
  if (args.existingPaid || PAID_OR_LATER.includes(args.status)) {
    throw new Error("Payment already recorded. Duplicate checkout is blocked.");
  }
  if (!paymentUnlocked(args.status)) {
    throw new Error("Payment is unavailable until the quote is ready for checkout.");
  }
}

export function isFailedPaymentEvent(type: string): boolean {
  return (
    type === "payment_intent.payment_failed" ||
    type === "checkout.session.expired" ||
    type === "checkout.session.async_payment_failed"
  );
}
