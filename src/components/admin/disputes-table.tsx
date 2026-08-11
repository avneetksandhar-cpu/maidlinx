"use client";

import { useRouter } from "next/navigation";
import { AdminDataTable, type Column, type FilterOption } from "@/components/admin/admin-data-table";
import { Button } from "@/components/ui";
import type { Dispute } from "@/lib/admin/disputes";
import { formatAdminDate, formatStatusLabel } from "@/lib/admin/display";

const STATUS_FILTERS: FilterOption[] = [
  { id: "open", label: "Open", value: "open" },
  { id: "investigating", label: "Investigating", value: "investigating" },
  { id: "resolved", label: "Resolved", value: "resolved" },
  { id: "closed", label: "Closed", value: "closed" },
];

export function DisputesTable({ disputes }: { disputes: Dispute[] }) {
  const router = useRouter();

  const columns: Column<Dispute>[] = [
    { key: "subject", header: "Subject", render: (row) => row.subject },
    {
      key: "booking",
      header: "Booking",
      render: (row) => <span className="font-mono text-xs">{row.bookingId.slice(0, 8)}</span>,
    },
    { key: "raised", header: "Raised by", render: (row) => row.raisedByName ?? "—" },
    {
      key: "status",
      header: "Status",
      render: (row) => formatStatusLabel(row.status),
    },
    { key: "created", header: "Created", render: (row) => formatAdminDate(row.createdAt) },
    {
      key: "actions",
      header: "",
      render: (row) =>
        row.status === "open" || row.status === "investigating" ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => updateDispute(row.id, "resolved")}
          >
            Resolve
          </Button>
        ) : null,
    },
  ];

  async function updateDispute(id: string, status: string) {
    await fetch("/api/admin/disputes", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status, resolution: "Resolved by admin." }),
    });
    router.refresh();
  }

  return (
    <AdminDataTable
      data={disputes}
      columns={columns}
      searchPlaceholder="Search disputes..."
      searchKeys={[(r) => r.subject, (r) => r.description, (r) => r.raisedByName]}
      filters={STATUS_FILTERS}
      filterKey="status"
    />
  );
}
