import {
  isLiveLocationStatus,
  normalizeBookingStatus,
  PAID_BOOKING_STATUSES,
} from "@/lib/bookings/status";
import type { BillingCadence, CommercialFrequency } from "@/lib/commercial/types";
import { recurringPriceBreakdown } from "@/lib/commercial/pricing-display";

export interface CommercialConfirmationInput {
  status: string;
  paymentStatus: string | null;
  professionalProfileId: string | null;
  cleanerId?: string | null;
  serviceOrderId: string | null;
  /** True when booking_answers.commercial or service_order_id present. */
  isCommercial: boolean;
  totalCents: number;
  currency?: string;
  frequency?: CommercialFrequency | string | null;
  billingCadence?: BillingCadence | string | null;
  /** Due now from proposal / order (0 when Stripe LIVE OFF + net/pay-after). */
  dueNowCents?: number | null;
  nextVisitAt?: string | null;
  scheduledAt?: string | null;
  arrivalWindowStart?: string | null;
  arrivalWindowEnd?: string | null;
}

export type CommercialConfirmPhase = "confirming" | "confirmed";

export interface CommercialConfirmationView {
  phase: CommercialConfirmPhase;
  headline: string;
  subcopy: string;
  paymentVerified: boolean;
  teamReserved: boolean;
  /** Customer-facing crew status before/after dispatch. */
  crewHeadline: string;
  showCrewOnTheWay: boolean;
  showLiveMapEligible: boolean;
  amountPaidTodayCents: number;
  pricePerVisitCents: number;
  pricePerVisitLabel: string;
  futureRecurringLabel: string | null;
  /** ISO only when a real next visit exists beyond this booking. */
  nextVisitAt: string | null;
}

const CONFIRMED_PAYMENT_STATUSES = new Set([
  "pending", // commercial net / pay-after after order created
  "deposit_paid",
  "paid",
  "unpaid", // net terms invoice pending — order still confirmed
]);

/**
 * Commercial "payment verified" with Stripe LIVE OFF:
 * service order exists (terms accepted) and booking is past pending_payment/draft.
 * Residential Stripe charge is not required for commercial confirm.
 */
export function isCommercialPaymentVerified(
  input: Pick<
    CommercialConfirmationInput,
    "status" | "paymentStatus" | "serviceOrderId" | "isCommercial"
  >,
): boolean {
  if (!input.isCommercial || !input.serviceOrderId) return false;
  const status = normalizeBookingStatus(input.status);
  if (status === "pending_payment" || status === "draft") return false;
  if (status === "cancelled") return false;
  const pay = (input.paymentStatus ?? "pending").toLowerCase();
  if (pay === "failed") return false;
  if ((PAID_BOOKING_STATUSES as readonly string[]).includes(status as never)) {
    return CONFIRMED_PAYMENT_STATUSES.has(pay) || pay === "pending";
  }
  return CONFIRMED_PAYMENT_STATUSES.has(pay);
}

export function isCommercialTeamReserved(
  input: Pick<
    CommercialConfirmationInput,
    "status" | "professionalProfileId" | "cleanerId"
  >,
): boolean {
  if (input.professionalProfileId || input.cleanerId) return true;
  const status = normalizeBookingStatus(input.status);
  return (
    status === "assigned" ||
    status === "accepted" ||
    status === "on_the_way" ||
    status === "arrived" ||
    status === "in_progress" ||
    status === "completed"
  );
}

function formatArrivalWindow(
  start: string | null | undefined,
  end: string | null | undefined,
  scheduledAt: string | null | undefined,
): string | null {
  const fmt = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
  const startDate = start ? new Date(start) : null;
  const endDate = end ? new Date(end) : null;
  if (
    startDate &&
    endDate &&
    !Number.isNaN(startDate.getTime()) &&
    !Number.isNaN(endDate.getTime())
  ) {
    return `${fmt.format(startDate)} – ${fmt.format(endDate)}`;
  }
  if (scheduledAt) {
    const d = new Date(scheduledAt);
    if (!Number.isNaN(d.getTime())) return fmt.format(d);
  }
  return null;
}

/**
 * Derive confirmation + crew headlines for commercial booking detail.
 * "Booking confirmed" only when payment verified AND team reserved.
 * "Crew on the way" only after real on_the_way+ status (never invented).
 */
export function getCommercialConfirmationView(
  input: CommercialConfirmationInput,
): CommercialConfirmationView {
  const paymentVerified = isCommercialPaymentVerified(input);
  const teamReserved = isCommercialTeamReserved(input);
  const status = normalizeBookingStatus(input.status);
  const confirmed = paymentVerified && teamReserved;

  const dueNow = Math.max(0, input.dueNowCents ?? 0);
  const price = recurringPriceBreakdown({
    visitCents: input.totalCents,
    frequency: input.frequency ?? "one_time",
    billingCadence: input.billingCadence ?? "per_visit",
    currency: input.currency ?? "USD",
  });

  const windowLabel = formatArrivalWindow(
    input.arrivalWindowStart,
    input.arrivalWindowEnd,
    input.scheduledAt,
  );

  const showCrewOnTheWay =
    status === "on_the_way" || status === "arrived" || status === "in_progress";
  const showLiveMapEligible =
    Boolean(input.professionalProfileId) && isLiveLocationStatus(input.status);

  let crewHeadline: string;
  if (status === "arrived") crewHeadline = "Your crew has arrived";
  else if (status === "in_progress") crewHeadline = "Cleaning in progress";
  else if (status === "completed") crewHeadline = "Clean completed";
  else if (status === "on_the_way") {
    crewHeadline = windowLabel
      ? `Crew on the way · arriving ${windowLabel.split("–")[0]?.trim()}`
      : "Crew on the way";
  } else if (windowLabel) {
    crewHeadline = `Scheduled · arrival ${windowLabel}`;
  } else {
    crewHeadline = "Scheduled";
  }

  // Next visit only when order has a real future next_visit_at after this booking.
  let nextVisitAt: string | null = null;
  if (input.nextVisitAt && input.scheduledAt) {
    const next = new Date(input.nextVisitAt).getTime();
    const thisVisit = new Date(input.scheduledAt).getTime();
    if (
      !Number.isNaN(next) &&
      !Number.isNaN(thisVisit) &&
      next > thisVisit + 60_000 &&
      input.frequency &&
      input.frequency !== "one_time"
    ) {
      nextVisitAt = input.nextVisitAt;
    }
  } else if (
    input.nextVisitAt &&
    input.frequency &&
    input.frequency !== "one_time"
  ) {
    const next = new Date(input.nextVisitAt).getTime();
    if (!Number.isNaN(next) && next > Date.now()) {
      nextVisitAt = input.nextVisitAt;
    }
  }

  if (!confirmed) {
    return {
      phase: "confirming",
      headline: "Confirming your booking",
      subcopy: !paymentVerified
        ? "Verifying payment terms and creating your visit…"
        : "Reserving your cleaning team…",
      paymentVerified,
      teamReserved,
      crewHeadline,
      showCrewOnTheWay: false,
      showLiveMapEligible: false,
      amountPaidTodayCents: dueNow,
      pricePerVisitCents: input.totalCents,
      pricePerVisitLabel: price.visitLabel,
      futureRecurringLabel: price.monthlyLabel,
      nextVisitAt: null,
    };
  }

  return {
    phase: "confirmed",
    headline: "Booking confirmed",
    subcopy: showCrewOnTheWay
      ? "Live updates from your assigned crew."
      : "Your visit is reserved. Add entry instructions so the crew can get in.",
    paymentVerified,
    teamReserved,
    crewHeadline,
    showCrewOnTheWay,
    showLiveMapEligible,
    amountPaidTodayCents: dueNow,
    pricePerVisitCents: input.totalCents,
    pricePerVisitLabel: price.visitLabel,
    futureRecurringLabel: price.monthlyLabel,
    nextVisitAt,
  };
}

/** After-hours default window (6–8 PM local) as timestamptz ISO strings. */
export function afterHoursArrivalWindow(scheduledAtIso: string): {
  start: string;
  end: string;
} {
  const base = new Date(scheduledAtIso);
  if (Number.isNaN(base.getTime())) {
    const fallback = new Date();
    fallback.setHours(18, 0, 0, 0);
    const end = new Date(fallback);
    end.setHours(20, 0, 0, 0);
    return { start: fallback.toISOString(), end: end.toISOString() };
  }
  const start = new Date(base);
  start.setHours(18, 0, 0, 0);
  const end = new Date(base);
  end.setHours(20, 0, 0, 0);
  return { start: start.toISOString(), end: end.toISOString() };
}
