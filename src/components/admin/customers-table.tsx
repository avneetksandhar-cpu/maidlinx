"use client";

import { AdminDataTable, type Column } from "@/components/admin/admin-data-table";
import type { AdminCustomer } from "@/lib/admin/customers";
import { formatAdminCurrency, formatAdminDate } from "@/lib/admin/display";
import { useState } from "react";
import { Button } from "@/components/ui";

interface CustomersTableProps {
  customers: AdminCustomer[];
}

export function CustomersTable({ customers }: CustomersTableProps) {
  const [selected, setSelected] = useState<AdminCustomer | null>(null);

  const columns: Column<AdminCustomer>[] = [
    {
      key: "name",
      header: "Name",
      render: (row) => (
        <button type="button" className="hover:text-gold" onClick={() => setSelected(row)}>
          {[row.firstName, row.lastName].filter(Boolean).join(" ") || "—"}
        </button>
      ),
    },
    { key: "email", header: "Email", render: (row) => row.email ?? "—" },
    { key: "phone", header: "Phone", render: (row) => row.phone ?? "—" },
    { key: "bookings", header: "Bookings", render: (row) => row.bookingCount },
    {
      key: "spent",
      header: "Total spent",
      render: (row) => formatAdminCurrency(row.totalSpentCents),
    },
    {
      key: "joined",
      header: "Joined",
      render: (row) => formatAdminDate(row.createdAt),
    },
    {
      key: "actions",
      header: "",
      render: (row) => (
        <button
          type="button"
          className="text-sm font-medium text-gold hover:underline"
          onClick={() => setSelected(row)}
        >
          View
        </button>
      ),
    },
  ];

  return (
    <>
      <AdminDataTable
        data={customers}
        columns={columns}
        searchPlaceholder="Search customers..."
        searchKeys={[
          (r) => [r.firstName, r.lastName].filter(Boolean).join(" "),
          (r) => r.email,
          (r) => r.phone,
        ]}
        emptyMessage="No customers yet."
      />

      {selected && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
          <button
            type="button"
            className="absolute inset-0 bg-ink/40"
            aria-label="Close"
            onClick={() => setSelected(null)}
          />
          <div className="relative z-10 w-full max-w-md rounded-xl border border-border bg-surface p-5 shadow-elevated">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold text-ink">Customer</h2>
              <Button variant="ghost" size="sm" onClick={() => setSelected(null)}>
                Close
              </Button>
            </div>
            <dl className="space-y-3 text-sm">
              <Detail label="Name" value={[selected.firstName, selected.lastName].filter(Boolean).join(" ") || "—"} />
              <Detail label="Email" value={selected.email ?? "—"} />
              <Detail label="Phone" value={selected.phone ?? "—"} />
              <Detail label="Bookings" value={String(selected.bookingCount)} />
              <Detail label="Total spent" value={formatAdminCurrency(selected.totalSpentCents)} />
              <Detail label="Joined" value={formatAdminDate(selected.createdAt)} />
            </dl>
          </div>
        </div>
      )}
    </>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-ink-muted">{label}</dt>
      <dd className="font-medium text-ink">{value}</dd>
    </div>
  );
}
