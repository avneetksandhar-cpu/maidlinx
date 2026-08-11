import { Suspense } from "react";
import { AdminDataTable, type Column } from "@/components/admin/admin-data-table";
import { AdminHeader } from "@/components/admin/admin-header";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { listPayments } from "@/lib/admin/payments";
import type { AdminPayment } from "@/lib/admin/payments";
import { requireAdminPermission } from "@/lib/admin/session";
import { formatAdminCurrency, formatAdminDate } from "@/lib/admin/display";
import { hasAdminEnv } from "@/lib/supabase/admin";

export const metadata = { title: "Payments" };

const columns: Column<AdminPayment>[] = [
  {
    key: "booking",
    header: "Booking",
    render: (row) => (
      <div>
        <p className="font-mono text-xs text-ink-subtle">{row.bookingId.slice(0, 8)}</p>
        {row.invoiceNumber && <p className="text-xs text-ink-muted">{row.invoiceNumber}</p>}
      </div>
    ),
  },
  {
    key: "customer",
    header: "Customer",
    render: (row) => row.customerEmail ?? "—",
  },
  {
    key: "type",
    header: "Type",
    render: (row) => row.paymentType,
  },
  {
    key: "amount",
    header: "Amount",
    render: (row) => formatAdminCurrency(row.amountCents, row.currency),
  },
  {
    key: "status",
    header: "Status",
    render: (row) => <StatusBadge status={row.status} />,
  },
  {
    key: "bookingStatus",
    header: "Booking",
    render: (row) => (row.bookingStatus ? <StatusBadge status={row.bookingStatus} /> : "—"),
  },
  {
    key: "created",
    header: "Date",
    render: (row) => formatAdminDate(row.createdAt),
  },
];

async function PaymentsContent() {
  await requireAdminPermission("payments.read");
  const payments = await listPayments(undefined, 200);

  return (
    <>
      <AdminHeader
        title="Payments"
        description="Deposit and balance payments across all bookings."
      />

      {!hasAdminEnv() && (
        <div className="mb-6 rounded-lg border border-border bg-surface-muted px-4 py-3 text-sm text-ink-muted">
          Database not configured. Payment records will appear once Supabase is connected.
        </div>
      )}

      <AdminDataTable
        data={payments}
        columns={columns}
        searchPlaceholder="Search email, invoice, payment ID..."
        searchKeys={[
          (r) => r.customerEmail,
          (r) => r.invoiceNumber,
          (r) => r.stripePaymentIntentId,
        ]}
        emptyMessage="No payments yet."
      />
    </>
  );
}

export default function AdminPaymentsPage() {
  return (
    <div className="px-4 py-8 sm:px-6 lg:px-10">
      <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-border" />}>
        <PaymentsContent />
      </Suspense>
    </div>
  );
}
