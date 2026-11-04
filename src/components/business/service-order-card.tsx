import Link from "next/link";
import {
  CalendarDays,
  CheckSquare,
  CreditCard,
  UserRound,
} from "lucide-react";
import { SiteKindIcon } from "@/components/business/site-kind-icon";
import { Button } from "@/components/ui";
import type { DashboardBooking } from "@/lib/dashboard/bookings";
import { routes } from "@/config/site";
import { formatCurrency } from "@/lib/utils";

interface ServiceOrderCardProps {
  job: DashboardBooking;
  siteLabel?: string;
}

/**
 * Screen 4 — Service order summary from a real booking.
 * Provider / window / contact / billing only when present — never fabricated.
 */
export function ServiceOrderCard({ job, siteLabel }: ServiceOrderCardProps) {
  const title = siteLabel?.trim() || job.addressLine1 || "Service order";
  const provider = job.professionalName?.trim() || "Provider assigning…";
  const when = formatWindow(job);
  const billing =
    job.totalCents > 0
      ? `Agreed ${formatCurrency(job.totalCents, job.currency)} · per visit`
      : "Billing terms pending quote";

  return (
    <div className="mx-auto w-full max-w-[430px] space-y-5 lg:max-w-none">
      <header className="space-y-3">
        <Link
          href={routes.dashboardJobs}
          className="inline-flex text-sm font-semibold text-[#04CED2]"
        >
          ← Jobs
        </Link>
        <h1 className="text-[1.85rem] font-bold tracking-tight text-white">
          Service order
        </h1>
        <div className="flex items-center gap-3">
          <SiteKindIcon label={title} />
          <div className="min-w-0">
            <p className="font-semibold text-white">{title}</p>
            <p className="text-sm text-[var(--ml-dark-ink-muted)]">{provider}</p>
          </div>
        </div>
      </header>

      <div className="rounded-2xl border border-[var(--ml-dark-border)] bg-[var(--ml-dark-surface)] px-4">
        <OrderRow
          icon={<CalendarDays className="size-5" aria-hidden />}
          label={`Next visit · ${when}`}
        />
        <OrderRow
          icon={<UserRound className="size-5" aria-hidden />}
          label={
            job.professionalName
              ? `Crew · ${job.professionalName}`
              : "Site contact · pending assignment"
          }
        />
        <OrderRow
          icon={<CheckSquare className="size-5" aria-hidden />}
          label="View checklist"
          href={routes.bookingStatus(job.id)}
        />
        <OrderRow
          icon={<CreditCard className="size-5" aria-hidden />}
          label={billing}
          href={routes.dashboardBilling}
        />
      </div>

      <p className="text-xs text-[var(--ml-dark-ink-subtle)]">
        Status: {job.status.replaceAll("_", " ")}. Flag missed visits from job details after the window.
      </p>

      <Link href={routes.bookingStatus(job.id)} className="block">
        <Button
          variant="primary"
          className="h-14 w-full rounded-2xl bg-[#04CED2] text-base font-semibold text-[#01193D] hover:bg-[#03b8bc]"
        >
          View job details
        </Button>
      </Link>
    </div>
  );
}

function OrderRow({
  icon,
  label,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  href?: string;
}) {
  const inner = (
    <div className="flex items-center gap-3 border-b border-[var(--ml-dark-border)] py-4 last:border-0">
      <span className="text-[#04CED2]">{icon}</span>
      <span className="text-[15px] font-medium text-white">{label}</span>
    </div>
  );
  if (href) {
    return (
      <Link href={href} className="block hover:opacity-90">
        {inner}
      </Link>
    );
  }
  return inner;
}

function formatWindow(job: DashboardBooking): string {
  const d = new Date(job.scheduledAt);
  if (Number.isNaN(d.getTime())) return "TBD";
  const day = d.toLocaleDateString(undefined, { weekday: "short" });
  if (job.arrivalWindowStart && job.arrivalWindowEnd) {
    return `${day}, ${job.arrivalWindowStart}–${job.arrivalWindowEnd}`;
  }
  return d.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
