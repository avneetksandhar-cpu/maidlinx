import { Suspense } from "react";
import { OpsAssignMobile } from "@/components/admin/ops-assign-mobile";
import { listBookings } from "@/lib/admin/bookings";
import { listCleaners } from "@/lib/admin/cleaners";
import { listOpsQueues } from "@/lib/admin/queues";
import { requireAdminPermission } from "@/lib/admin/session";
import { ACTIVE_JOB_STATUSES } from "@/lib/bookings/status";

export const metadata = { title: "Operations" };

async function AssignmentsContent() {
  await requireAdminPermission("assignments.read");

  const [queues, cleaners, assignedResult] = await Promise.all([
    listOpsQueues("needs_assignment"),
    listCleaners(undefined, 80),
    listBookings({ limit: 50 }),
  ]);

  const assigned = assignedResult.bookings.filter(
    (b) =>
      Boolean(b.professionalProfileId) &&
      (ACTIVE_JOB_STATUSES as readonly string[]).includes(b.status),
  );

  return (
    <OpsAssignMobile
      needsAssignment={queues.needs_assignment}
      assigned={assigned}
      cleaners={cleaners}
    />
  );
}

export default function AdminAssignmentsPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-lg px-4 py-5">
          <div className="h-64 animate-pulse rounded-2xl bg-[var(--ml-dark-surface)]" />
        </div>
      }
    >
      <AssignmentsContent />
    </Suspense>
  );
}
