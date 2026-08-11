import { Suspense } from "react";
import { AdminHeader } from "@/components/admin/admin-header";
import { CustomersTable } from "@/components/admin/customers-table";
import { listCustomers } from "@/lib/admin/customers";
import { requireAdminPermission } from "@/lib/admin/session";
import { hasAdminEnv } from "@/lib/supabase/admin";

export const metadata = { title: "Customers" };

async function CustomersContent() {
  await requireAdminPermission("customers.read");
  const customers = await listCustomers(undefined, 200);

  return (
    <>
      <AdminHeader title="Customers" description="Customer accounts and booking history." />

      {!hasAdminEnv() && (
        <div className="mb-6 rounded-lg border border-border bg-surface-muted px-4 py-3 text-sm text-ink-muted">
          Database not configured. Customer records will appear once Supabase is connected.
        </div>
      )}

      <CustomersTable customers={customers} />
    </>
  );
}

export default function AdminCustomersPage() {
  return (
    <div className="px-4 py-8 sm:px-6 lg:px-10">
      <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-border" />}>
        <CustomersContent />
      </Suspense>
    </div>
  );
}
