"use client";

import { useRouter } from "next/navigation";
import { AdminDataTable, type Column, type FilterOption } from "@/components/admin/admin-data-table";
import { Button } from "@/components/ui";
import type { RefundRecord } from "@/lib/admin/refunds";
import { formatAdminCurrency, formatAdminDate, formatStatusLabel } from "@/lib/admin/display";

const STATUS_FILTERS: FilterOption[] = [
  { id: "pending", label: "Pending", value: "pending" },
  { id: "processed", label: "Processed", value: "processed" },
  { id: "failed", label: "Failed", value: "failed" },
];

export function RefundsTable({ refunds }: { refunds: RefundRecord[] }) {
  const router = useRouter();

  const columns: Column<RefundRecord>[] = [
    {
      key: "booking",
      header: "Booking",
      render: (row) => <span className="font-mono text-xs">{row.bookingId.slice(0, 8)}</span>,
    },
    { key: "customer", header: "Customer", render: (row) => row.customerEmail ?? "—" },
    {
      key: "amount",
      header: "Amount",
      render: (row) => formatAdminCurrency(row.amountCents),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => formatStatusLabel(row.status),
    },
    { key: "reason", header: "Reason", render: (row) => row.reason ?? "—" },
    { key: "created", header: "Created", render: (row) => formatAdminDate(row.createdAt) },
    {
      key: "actions",
      header: "",
      render: (row) =>
        row.status === "pending" ? (
          <Button variant="gold" size="sm" onClick={() => processRefund(row.id)}>
            Process
          </Button>
        ) : row.stripeRefundId ? (
          <span className="font-mono text-xs text-ink-subtle">{row.stripeRefundId.slice(0, 12)}</span>
        ) : null,
    },
  ];

  async function processRefund(id: string) {
    await fetch("/api/admin/refunds", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "process", id }),
    });
    router.refresh();
  }

  return (
    <AdminDataTable
      data={refunds}
      columns={columns}
      searchPlaceholder="Search refunds..."
      searchKeys={[(r) => r.customerEmail, (r) => r.reason, (r) => r.stripeRefundId]}
      filters={STATUS_FILTERS}
      filterKey="status"
    />
  );
}
