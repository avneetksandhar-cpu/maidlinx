"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AdminDataTable, type Column } from "@/components/admin/admin-data-table";
import { BookingDetailPanel } from "@/components/admin/booking-detail-panel";
import { StatusBadge } from "@/components/dashboard/status-badge";
import type { AdminBooking } from "@/lib/admin/bookings";
import { BOOKING_STATUS_LABELS, BOOKING_STATUSES } from "@/lib/bookings/status";
import { formatAdminCurrency, formatAdminDate, getServiceLabel } from "@/lib/admin/display";

const STATUS_FILTERS = BOOKING_STATUSES.map((status) => ({
  id: status,
  label: BOOKING_STATUS_LABELS[status],
  value: status,
}));

export function BookingsTable({ bookings }: { bookings: AdminBooking[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookingFromQuery = searchParams?.get("booking") ?? null;
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState("");
  const activeBookingId = selectedId ?? bookingFromQuery;

  const filteredByDate = useMemo(() => {
    if (!dateFilter) return bookings;
    return bookings.filter((b) => b.scheduledAt.slice(0, 10) === dateFilter);
  }, [bookings, dateFilter]);

  const columns: Column<AdminBooking>[] = [
    {
      key: "id",
      header: "Booking",
      render: (row) => (
        <button
          type="button"
          className="text-left hover:text-gold"
          onClick={() => setSelectedId(row.id)}
        >
          <p className="font-mono text-xs text-ink-subtle">{row.id.slice(0, 8)}</p>
          {row.invoiceNumber && <p className="text-xs text-ink-muted">{row.invoiceNumber}</p>}
        </button>
      ),
    },
    {
      key: "service",
      header: "Service",
      render: (row) => getServiceLabel(row.serviceType),
    },
    {
      key: "customer",
      header: "Customer",
      render: (row) => row.customerEmail ?? row.customerName ?? "—",
    },
    {
      key: "cleaner",
      header: "Cleaner",
      render: (row) => row.professionalName ?? "Unassigned",
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: "total",
      header: "Total",
      render: (row) => formatAdminCurrency(row.totalCents, row.currency),
    },
    {
      key: "scheduled",
      header: "Scheduled",
      render: (row) => formatAdminDate(row.scheduledAt),
    },
    {
      key: "actions",
      header: "",
      render: (row) => (
        <button
          type="button"
          className="text-sm font-medium text-gold hover:underline"
          onClick={() => setSelectedId(row.id)}
        >
          View
        </button>
      ),
    },
  ];

  async function handleBulk(action: string, ids: string[]) {
    await fetch("/api/admin/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ids }),
    });
    router.refresh();
  }

  return (
    <>
      <AdminDataTable
        data={filteredByDate}
        columns={columns}
        searchPlaceholder="Search email, invoice, city..."
        searchKeys={[
          (r) => r.customerEmail,
          (r) => r.invoiceNumber,
          (r) => r.addressCity,
          (r) => r.customerName,
        ]}
        filters={STATUS_FILTERS}
        filterKey="status"
        bulkActions={[
          { label: "Cancel selected", action: "cancel", variant: "ghost" },
          { label: "Confirm selected", action: "confirm", variant: "secondary" },
        ]}
        onBulkAction={handleBulk}
        headerExtra={
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="h-11 rounded-lg border border-border bg-surface px-3 text-sm text-ink"
            aria-label="Filter by date"
          />
        }
      />

      <BookingDetailPanel
        bookingId={selectedId}
        onClose={() => {
          setSelectedId(null);
          if (searchParams?.get("booking")) {
            router.replace("/admin/bookings");
          }
        }}
      />
    </>
  );
}
