import Link from "next/link";
import { Suspense } from "react";
import { AdminHeader } from "@/components/admin/admin-header";
import { listSupportIssues } from "@/lib/admin/support-issues";
import { requireAdminPermission } from "@/lib/admin/session";
import { formatAdminDate } from "@/lib/admin/display";
import { routes } from "@/config/site";

export const metadata = { title: "Support Issues" };

async function SupportContent() {
  await requireAdminPermission("support.read");
  const issues = await listSupportIssues();

  return (
    <>
      <AdminHeader
        title="Support issues"
        description="Customer issues, re-clean requests, and escalations from ops queues."
      />
      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        {issues.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-ink-muted">No open support issues.</p>
        ) : (
          <ul className="divide-y divide-border">
            {issues.map((issue) => (
              <li key={issue.id} className="flex flex-wrap items-start justify-between gap-3 px-5 py-4">
                <div>
                  <p className="font-medium text-ink">{issue.subject}</p>
                  <p className="mt-1 text-sm text-ink-muted">
                    {issue.issueType.replaceAll("_", " ")} · {issue.status} · {issue.priority}
                  </p>
                  {issue.description && (
                    <p className="mt-2 max-w-2xl text-sm text-ink">{issue.description}</p>
                  )}
                  <p className="mt-2 text-xs text-ink-subtle">{formatAdminDate(issue.createdAt)}</p>
                </div>
                {issue.bookingId && (
                  <Link
                    href={`${routes.adminBookings}?booking=${issue.bookingId}`}
                    className="text-sm font-medium text-navy hover:underline"
                  >
                    Booking {issue.bookingId.slice(0, 8)}
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

export default function AdminSupportPage() {
  return (
    <div className="px-4 py-8 sm:px-6 lg:px-10">
      <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-border" />}>
        <SupportContent />
      </Suspense>
    </div>
  );
}
