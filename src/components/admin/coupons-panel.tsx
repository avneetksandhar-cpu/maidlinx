"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AdminDataTable, type Column } from "@/components/admin/admin-data-table";
import { Button, Input, Label } from "@/components/ui";
import type { Coupon } from "@/lib/admin/coupons";
import { formatAdminDate } from "@/lib/admin/display";

export function CouponsPanel({ coupons }: { coupons: Coupon[] }) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState<"percent" | "fixed">("percent");
  const [discountValue, setDiscountValue] = useState("10");
  const [loading, setLoading] = useState(false);

  const columns: Column<Coupon>[] = [
    { key: "code", header: "Code", render: (row) => <span className="font-mono font-medium">{row.code}</span> },
    {
      key: "discount",
      header: "Discount",
      render: (row) =>
        row.discountType === "percent" ? `${row.discountValue}%` : `$${(row.discountValue / 100).toFixed(2)}`,
    },
    { key: "used", header: "Used", render: (row) => `${row.usedCount}${row.maxUses ? ` / ${row.maxUses}` : ""}` },
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
          onClick={() => toggleCoupon(row.id, !row.isActive)}
        >
          {row.isActive ? "Deactivate" : "Activate"}
        </Button>
      ),
    },
  ];

  async function toggleCoupon(id: string, isActive: boolean) {
    await fetch("/api/admin/coupons", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, isActive }),
    });
    router.refresh();
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch("/api/admin/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          discountType,
          discountValue: discountType === "percent" ? Number(discountValue) : Number(discountValue) * 100,
          isActive: true,
        }),
      });
      setShowForm(false);
      setCode("");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function handleBulk(action: string, ids: string[]) {
    if (action === "deactivate") {
      await fetch("/api/admin/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "bulk_deactivate", ids }),
      });
      router.refresh();
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="gold" onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancel" : "Create coupon"}
        </Button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="rounded-xl border border-border bg-surface p-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label htmlFor="coupon-code">Code</Label>
              <Input id="coupon-code" value={code} onChange={(e) => setCode(e.target.value)} required className="mt-2 uppercase" />
            </div>
            <div>
              <Label htmlFor="coupon-type">Type</Label>
              <select
                id="coupon-type"
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value as "percent" | "fixed")}
                className="mt-2 h-11 w-full rounded-lg border border-border bg-surface px-3 text-sm"
              >
                <option value="percent">Percent</option>
                <option value="fixed">Fixed amount</option>
              </select>
            </div>
            <div>
              <Label htmlFor="coupon-value">Value</Label>
              <Input id="coupon-value" type="number" value={discountValue} onChange={(e) => setDiscountValue(e.target.value)} required className="mt-2" />
            </div>
          </div>
          <Button type="submit" variant="gold" disabled={loading}>
            {loading ? "Creating..." : "Create coupon"}
          </Button>
        </form>
      )}

      <AdminDataTable
        data={coupons}
        columns={columns}
        searchPlaceholder="Search coupon codes..."
        searchKeys={[(r) => r.code, (r) => r.description]}
        bulkActions={[{ label: "Deactivate selected", action: "deactivate", variant: "ghost" }]}
        onBulkAction={handleBulk}
      />
    </div>
  );
}
