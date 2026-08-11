import { Suspense } from "react";
import { AdminHeader } from "@/components/admin/admin-header";
import { CleanersTable } from "@/components/admin/cleaners-table";
import { listCleaners } from "@/lib/admin/cleaners";
import { requireAdminPermission } from "@/lib/admin/session";
import { hasAdminEnv } from "@/lib/supabase/admin";

export const metadata = { title: "Cleaners" };

async function CleanersContent() {
  await requireAdminPermission("cleaners.read");
  const cleaners = await listCleaners(undefined, 200);

  return (
    <>
      <AdminHeader
        title="Cleaners"
        description="Approve onboarding, activate supply, and review Connect status. Approval is ops review — not a background check."
      />

      {!hasAdminEnv() && (
        <div className="mb-6 rounded-lg border border-border bg-surface-muted px-4 py-3 text-sm text-ink-muted">
          Database not configured. Cleaner records will appear once Supabase is connected.
        </div>
      )}

      <CleanersTable cleaners={cleaners} />
    </>
  );
}

export default function AdminCleanersPage() {
  return (
    <div className="px-4 py-8 sm:px-6 lg:px-10">
      <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-border" />}>
        <CleanersContent />
      </Suspense>
    </div>
  );
}
