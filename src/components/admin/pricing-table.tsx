"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AdminDataTable, type Column } from "@/components/admin/admin-data-table";
import { Button, Input } from "@/components/ui";
import type { PricingRule } from "@/lib/admin/pricing";
import { formatAdminCurrency, getServiceLabel } from "@/lib/admin/display";

export function PricingTable({ rules }: { rules: PricingRule[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<string | null>(null);
  const [values, setValues] = useState<Record<string, Partial<PricingRule>>>({});

  async function save(id: string) {
    const updates = values[id];
    if (!updates) return;

    await fetch("/api/admin/pricing", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id,
        baseCents: updates.baseCents,
        bedroomCents: updates.bedroomCents,
        bathroomCents: updates.bathroomCents,
        platformFeePercent: updates.platformFeePercent,
      }),
    });
    setEditing(null);
    router.refresh();
  }

  const columns: Column<PricingRule>[] = [
    {
      key: "service",
      header: "Service",
      render: (row) => getServiceLabel(row.serviceType),
    },
    {
      key: "base",
      header: "Base price",
      render: (row) =>
        editing === row.id ? (
          <Input
            type="number"
            className="h-9 w-28"
            defaultValue={row.baseCents / 100}
            onChange={(e) =>
              setValues((v) => ({
                ...v,
                [row.id]: { ...v[row.id], baseCents: Math.round(Number(e.target.value) * 100) },
              }))
            }
          />
        ) : (
          formatAdminCurrency(row.baseCents)
        ),
    },
    {
      key: "bedroom",
      header: "Per bedroom",
      render: (row) =>
        editing === row.id ? (
          <Input
            type="number"
            className="h-9 w-24"
            defaultValue={row.bedroomCents / 100}
            onChange={(e) =>
              setValues((v) => ({
                ...v,
                [row.id]: { ...v[row.id], bedroomCents: Math.round(Number(e.target.value) * 100) },
              }))
            }
          />
        ) : (
          formatAdminCurrency(row.bedroomCents)
        ),
    },
    {
      key: "fee",
      header: "Platform fee %",
      render: (row) =>
        editing === row.id ? (
          <Input
            type="number"
            className="h-9 w-20"
            defaultValue={row.platformFeePercent}
            onChange={(e) =>
              setValues((v) => ({
                ...v,
                [row.id]: { ...v[row.id], platformFeePercent: Number(e.target.value) },
              }))
            }
          />
        ) : (
          `${row.platformFeePercent}%`
        ),
    },
    {
      key: "actions",
      header: "",
      render: (row) =>
        editing === row.id ? (
          <div className="flex gap-1">
            <Button variant="gold" size="sm" onClick={() => save(row.id)}>
              Save
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setEditing(null)}>
              Cancel
            </Button>
          </div>
        ) : (
          <Button variant="ghost" size="sm" onClick={() => setEditing(row.id)}>
            Edit
          </Button>
        ),
    },
  ];

  return <AdminDataTable data={rules} columns={columns} emptyMessage="No pricing rules configured." />;
}
