import { Suspense } from "react";
import { AdminHeader } from "@/components/admin/admin-header";
import { RefundsTable } from "@/components/admin/refunds-table";
import { listRefunds } from "@/lib/admin/refunds";
import { requireAdminPermission } from "@/lib/admin/session";

export const metadata = { title: "Refunds" };

async function RefundsContent() {
  await requireAdminPermission("refunds.write");
  const refunds = await listRefunds();

  return (
    <>
      <AdminHeader title="Refunds" description="Issue and process refunds via Stripe." />
      <RefundsTable refunds={refunds} />
    </>
  );
}

export default function AdminRefundsPage() {
  return (
    <div className="px-4 py-8 sm:px-6 lg:px-10">
      <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-border" />}>
        <RefundsContent />
      </Suspense>
    </div>
  );
}
