import { Check } from "lucide-react";
import { bookingStatusPillLabel, isPositiveStatus } from "@/lib/dashboard/booking-labels";
import { cn } from "@/lib/utils";

export function BookingStatusPill({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  const label = bookingStatusPillLabel(status);
  const positive = isPositiveStatus(status);
  const cancelled = String(status).toLowerCase() === "cancelled";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-semibold",
        cancelled
          ? "bg-red-50 text-red-700"
          : positive
            ? "bg-[#E8F7EE] text-[#1B7A45]"
            : "bg-[#F1F4F8] text-[#5A6578]",
        className,
      )}
    >
      {positive && !cancelled ? <Check className="size-3.5" strokeWidth={2.5} aria-hidden /> : null}
      {label}
    </span>
  );
}
