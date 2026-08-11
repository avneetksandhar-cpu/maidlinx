import { Suspense } from "react";
import { AdminDataTable, type Column } from "@/components/admin/admin-data-table";
import { AdminHeader } from "@/components/admin/admin-header";
import { Card, CardContent } from "@/components/ui";
import { listConnectAccounts, listStripePayouts } from "@/lib/admin/payouts";
import type { StripePayout } from "@/lib/admin/payouts";
import { requireAdminPermission } from "@/lib/admin/session";
import { formatAdminCurrency, formatAdminDate, formatStatusLabel } from "@/lib/admin/display";

export const metadata = { title: "Stripe Payouts" };

const payoutColumns: Column<StripePayout>[] = [
  { key: "id", header: "Payout ID", render: (row) => <span className="font-mono text-xs">{row.id}</span> },
  { key: "amount", header: "Amount", render: (row) => formatAdminCurrency(row.amountCents, row.currency) },
  { key: "status", header: "Status", render: (row) => formatStatusLabel(row.status) },
  {
    key: "arrival",
    header: "Arrival",
    render: (row) => (row.arrivalDate ? formatAdminDate(row.arrivalDate) : "—"),
  },
  { key: "method", header: "Method", render: (row) => row.method },
  { key: "created", header: "Created", render: (row) => formatAdminDate(row.createdAt) },
];

async function PayoutsContent() {
  await requireAdminPermission("payouts.read");
  const [payouts, connectAccounts] = await Promise.all([
    listStripePayouts(),
    listConnectAccounts(),
  ]);

  return (
    <>
      <AdminHeader title="Stripe payouts" description="Platform payouts and connected cleaner accounts." />

      <Card className="mb-6">
        <CardContent>
          <h2 className="mb-2 font-display text-lg font-semibold text-ink">Connect accounts</h2>
          <p className="text-sm text-ink-muted">
            {connectAccounts.length} professional{connectAccounts.length === 1 ? "" : "s"} with Stripe Connect
          </p>
          {connectAccounts.length > 0 && (
            <ul className="mt-4 space-y-2">
              {connectAccounts.map((account) => (
                <li key={account.profileId} className="flex justify-between text-sm">
                  <span>{account.name}</span>
                  <span className="font-mono text-xs text-ink-subtle">{account.connectId}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <AdminDataTable
        data={payouts}
        columns={payoutColumns}
        searchPlaceholder="Search payout IDs..."
        searchKeys={[(r) => r.id, (r) => r.description]}
        emptyMessage="No Stripe payouts found. Connect your Stripe account to view payout history."
      />
    </>
  );
}

export default function AdminPayoutsPage() {
  return (
    <div className="px-4 py-8 sm:px-6 lg:px-10">
      <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-border" />}>
        <PayoutsContent />
      </Suspense>
    </div>
  );
}
