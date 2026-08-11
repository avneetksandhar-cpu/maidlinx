"use client";

import { useBooking } from "@/components/booking/booking-provider";
import { getPropertyType } from "@/config/property-types";
import { getBookingServiceLabel, BOOKING_EXTRAS } from "@/lib/bookings/constants";
import { cn } from "@/lib/utils";

interface BookingFlowSummaryProps {
  className?: string;
  footerHint?: React.ReactNode;
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 py-2.5">
      <span className="text-sm text-ink-muted">{label}</span>
      <span className="max-w-[60%] text-right text-sm font-medium text-ink">{value}</span>
    </div>
  );
}

export function BookingFlowSummary({ className, footerHint }: BookingFlowSummaryProps) {
  const { state } = useBooking();

  const address =
    state.formattedAddress ||
    [state.line1, state.city].filter(Boolean).join(", ") ||
    null;
  const propertyLabel = state.propertyType
    ? (getPropertyType(state.propertyType)?.label ?? state.propertyType)
    : null;
  const serviceLabel = state.serviceType
    ? getBookingServiceLabel(state.serviceType)
    : null;
  const extrasCount = state.extras?.length ?? 0;
  const extrasLabel =
    extrasCount === 0
      ? null
      : `${extrasCount} extra${extrasCount === 1 ? "" : "s"}`;
  const whenLabel = [state.date, state.arrivalWindow].filter(Boolean).join(" · ") || null;

  const hasAny = Boolean(address || propertyLabel || serviceLabel || whenLabel);

  return (
    <aside
      className={cn(
        "rounded-xl border border-border bg-surface p-5 shadow-soft",
        className,
      )}
    >
      <p className="text-xs font-semibold tracking-[0.12em] text-ink-subtle uppercase">
        Your booking
      </p>
      {hasAny ? (
        <div className="mt-3 divide-y divide-border/80">
          {address ? <SummaryRow label="Address" value={address} /> : null}
          {propertyLabel ? <SummaryRow label="Space" value={propertyLabel} /> : null}
          {serviceLabel ? <SummaryRow label="Service" value={serviceLabel} /> : null}
          {extrasLabel ? <SummaryRow label="Extras" value={extrasLabel} /> : null}
          {whenLabel ? <SummaryRow label="When" value={whenLabel} /> : null}
          {state.extras?.length ? (
            <p className="pt-2 text-xs text-ink-subtle">
              {(state.extras ?? [])
                .map((id) => BOOKING_EXTRAS.find((e) => e.id === id)?.label ?? id)
                .join(" · ")}
            </p>
          ) : null}
        </div>
      ) : (
        <p className="mt-3 text-sm leading-relaxed text-ink-muted">
          Your details appear here as you go.
        </p>
      )}
      {footerHint ? <div className="mt-4 border-t border-border pt-4">{footerHint}</div> : null}
    </aside>
  );
}
