import Link from "next/link";
import { Suspense } from "react";
import { AdminHeader } from "@/components/admin/admin-header";
import {
  listOpsQueues,
  OPS_QUEUE_KEYS,
  OPS_QUEUE_LABELS,
  type OpsQueueKey,
} from "@/lib/admin/queues";
import { requireAdminPermission } from "@/lib/admin/session";
import { formatAdminDate } from "@/lib/admin/display";
import { routes } from "@/config/site";

export const metadata = { title: "Assignments" };

async function AssignmentsContent({
  searchParams,
}: {
  searchParams: Promise<{ queue?: string }>;
}) {
  await requireAdminPermission("assignments.read");
  const params = await searchParams;
  const selected = OPS_QUEUE_KEYS.includes(params.queue as OpsQueueKey)
    ? (params.queue as OpsQueueKey)
    : "needs_assignment";

  const queues = await listOpsQueues();
  const items = queues[selected];

  return (
    <>
      <AdminHeader
        title="Assignments & queues"
        description="Needs assignment, late cleaners, payment issues, cancellations, and support escalations."
      />

      <div className="flex flex-wrap gap-2">
        {OPS_QUEUE_KEYS.map((key) => {
          const active = key === selected;
          return (
            <Link
              key={key}
              href={`${routes.adminAssignments}?queue=${key}`}
              className={`rounded-lg px-3 py-2 text-sm font-medium ${
                active
                  ? "bg-ink text-white"
                  : "border border-border bg-surface text-ink-muted hover:text-ink"
              }`}
            >
              {OPS_QUEUE_LABELS[key]}
              <span className="ml-2 font-mono text-xs opacity-70">{queues[key].length}</span>
            </Link>
          );
        })}
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-border bg-surface">
        {items.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-ink-muted">Queue is clear.</p>
        ) : (
          <ul className="divide-y divide-border">
            {items.map((item) => (
              <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                <div>
                  <p className="font-medium text-ink">{item.title}</p>
                  <p className="mt-0.5 text-sm text-ink-muted">
                    {[item.subtitle, item.marketLabel, item.status].filter(Boolean).join(" · ")}
                  </p>
                  {item.scheduledAt && (
                    <p className="mt-1 text-xs text-ink-subtle">
                      Scheduled {formatAdminDate(item.scheduledAt)}
                    </p>
                  )}
                </div>
                {item.bookingId && (
                  <Link
                    href={`${routes.adminBookings}?booking=${item.bookingId}`}
                    className="text-sm font-medium text-navy hover:underline"
                  >
                    Open booking
                  </Link>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}

export default function AdminAssignmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ queue?: string }>;
}) {
  return (
    <div className="px-4 py-8 sm:px-6 lg:px-10">
      <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-border" />}>
        <AssignmentsContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
