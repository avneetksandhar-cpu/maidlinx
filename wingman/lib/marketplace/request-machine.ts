import { REQUEST_STATUSES, type RequestStatus } from "@/lib/marketplace/constants";

const ALLOWED: Record<RequestStatus, RequestStatus[]> = {
  draft: ["payment_pending", "cancelled"],
  submitted: ["under_review", "cancelled"],
  under_review: ["routed", "cancelled"],
  routed: ["wingman_accepted", "wingman_declined", "revised_terms", "cancelled"],
  wingman_accepted: ["awaiting_customer", "cancelled"],
  wingman_declined: ["under_review", "cancelled"],
  revised_terms: ["awaiting_customer", "cancelled"],
  awaiting_customer: ["accepted", "cancelled"],
  accepted: ["payment_pending", "cancelled"],
  payment_pending: ["paid", "cancelled"],
  paid: ["confirmed", "refunded", "disputed"],
  confirmed: ["in_progress", "completed", "cancelled", "refunded", "disputed"],
  in_progress: ["completed", "cancelled", "refunded", "disputed"],
  completed: ["refunded", "disputed"],
  cancelled: ["refunded"],
  refunded: [],
  disputed: ["refunded", "confirmed"],
};

/** Only a verified Stripe webhook may apply this transition. */
export const WEBHOOK_ONLY_TRANSITIONS: Array<[RequestStatus, RequestStatus]> = [
  ["payment_pending", "paid"],
];

export function isRequestStatus(value: string): value is RequestStatus {
  return REQUEST_STATUSES.includes(value as RequestStatus);
}

export function canTransition(from: RequestStatus, to: RequestStatus): boolean {
  return ALLOWED[from].includes(to);
}

export function assertTransition(from: RequestStatus, to: RequestStatus): void {
  if (!canTransition(from, to)) {
    throw new Error(`Illegal request transition: ${from} → ${to}`);
  }
}

export function paymentUnlocked(status: RequestStatus): boolean {
  return status === "draft" || status === "accepted" || status === "payment_pending";
}

export function chatUnlocked(status: RequestStatus): boolean {
  return (
    status === "paid" ||
    status === "confirmed" ||
    status === "in_progress" ||
    status === "completed"
  );
}

export function isWebhookOnlyTransition(from: RequestStatus, to: RequestStatus): boolean {
  return WEBHOOK_ONLY_TRANSITIONS.some(([a, b]) => a === from && b === to);
}

export function canSendMessage(args: {
  status: RequestStatus;
  userId: string;
  customerId: string;
  wingmanUserId: string | null;
  operator: boolean;
}): { ok: true } | { ok: false; reason: string } {
  const party =
    args.operator || args.userId === args.customerId || args.userId === args.wingmanUserId;
  if (!party) {
    return { ok: false, reason: "Not a party to this booking." };
  }
  if (!args.operator && !chatUnlocked(args.status)) {
    return { ok: false, reason: "Private chat opens after a paid confirmation." };
  }
  return { ok: true };
}

export function isTerminal(status: RequestStatus): boolean {
  return ALLOWED[status].length === 0;
}

export function allowedTransitions(from: RequestStatus): RequestStatus[] {
  return [...ALLOWED[from]];
}
