import { cn } from "@/lib/utils";
import { getStatusLabel } from "@/lib/dashboard/display";
import { normalizeBookingStatus } from "@/lib/bookings/status";

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-neutral-50 text-neutral-700 ring-neutral-200",
  pending_payment: "bg-amber-50 text-amber-800 ring-amber-200",
  confirmed: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  awaiting_assignment: "bg-sky-50 text-sky-800 ring-sky-200",
  offered: "bg-cyan-50 text-cyan-800 ring-cyan-200",
  assigned: "bg-blue-50 text-blue-800 ring-blue-200",
  accepted: "bg-blue-50 text-blue-800 ring-blue-200",
  on_the_way: "bg-indigo-50 text-indigo-800 ring-indigo-200",
  arrived: "bg-violet-50 text-violet-800 ring-violet-200",
  in_progress: "bg-violet-50 text-violet-800 ring-violet-200",
  completed: "bg-neutral-100 text-neutral-700 ring-neutral-200",
  cancelled: "bg-red-50 text-red-800 ring-red-200",
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const normalized = String(normalizeBookingStatus(status));
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        STATUS_STYLES[normalized] ?? "bg-surface-muted text-ink-muted ring-border",
        className,
      )}
    >
      {getStatusLabel(normalized)}
    </span>
  );
}
