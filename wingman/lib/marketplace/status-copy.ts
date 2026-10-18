const CUSTOMER_STATUS: Record<string, string> = {
  draft: "Requested",
  submitted: "Requested",
  under_review: "Requested",
  routed: "Requested",
  wingman_accepted: "Being arranged",
  wingman_declined: "Being arranged",
  revised_terms: "Being arranged",
  awaiting_customer: "Being arranged",
  accepted: "Being arranged",
  payment_pending: "Being arranged",
  paid: "Confirmed",
  confirmed: "Confirmed",
  in_progress: "Tonight",
  completed: "Completed",
  cancelled: "Closed",
  refunded: "Closed",
  disputed: "Closed",
};

export function customerBookingStatus(status: string): string {
  return CUSTOMER_STATUS[status] ?? "Requested";
}
