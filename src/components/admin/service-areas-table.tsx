"use client";

import { useRouter } from "next/navigation";
import { AdminDataTable, type Column } from "@/components/admin/admin-data-table";
import { Button } from "@/components/ui";
import type { ServiceArea } from "@/lib/admin/service-areas";
import { formatAdminDate } from "@/lib/admin/display";

export function ServiceAreasTable({ areas }: { areas: ServiceArea[] }) {
  const router = useRouter();

  const columns: Column<ServiceArea>[] = [
    { key: "name", header: "Area", render: (row) => row.name },
    { key: "city", header: "City", render: (row) => `${row.city}, ${row.state}` },
    {
      key: "zips",
      header: "Postal codes",
      render: (row) => row.postalCodes.join(", ") || "—",
    },
    {
      key: "status",
      header: "Status",
      render: (row) => (
        <span className={row.isActive ? "text-success" : "text-ink-muted"}>
          {row.isActive ? "Active" : "Inactive"}
        </span>
      ),
    },
    { key: "created", header: "Created", render: (row) => formatAdminDate(row.createdAt) },
    {
      key: "actions",
      header: "",
      render: (row) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={async () => {
            await fetch("/api/admin/service-areas", {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ id: row.id, isActive: !row.isActive }),
            });
            router.refresh();
          }}
        >
          {row.isActive ? "Deactivate" : "Activate"}
        </Button>
      ),
    },
  ];

  return (
    <AdminDataTable
      data={areas}
      columns={columns}
      searchPlaceholder="Search service areas..."
      searchKeys={[(r) => r.name, (r) => r.city, (r) => r.state]}
    />
  );
}
