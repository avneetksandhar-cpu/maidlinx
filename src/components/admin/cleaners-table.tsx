"use client";

import { useRouter } from "next/navigation";
import { AdminDataTable, type Column } from "@/components/admin/admin-data-table";
import { Button } from "@/components/ui";
import type { AdminCleaner } from "@/lib/admin/cleaners";

export function CleanersTable({ cleaners }: { cleaners: AdminCleaner[] }) {
  const router = useRouter();

  const columns: Column<AdminCleaner>[] = [
    {
      key: "name",
      header: "Name",
      render: (row) => [row.firstName, row.lastName].filter(Boolean).join(" ") || "—",
    },
    {
      key: "onboarding",
      header: "Onboarding",
      render: (row) => (
        <span className="font-mono text-xs text-ink">{row.onboardingStatus}</span>
      ),
    },
    {
      key: "online",
      header: "Online",
      render: (row) => (
        <span className={row.isOnline ? "text-success" : "text-ink-muted"}>
          {row.isOnline ? "Online" : "Offline"}
        </span>
      ),
    },
    {
      key: "connect",
      header: "Connect",
      render: (row) => (
        <span className="font-mono text-xs text-ink-muted">{row.stripeConnectStatus}</span>
      ),
    },
    {
      key: "rating",
      header: "Rating",
      render: (row) => `${row.ratingAverage.toFixed(1)} (${row.ratingCount})`,
    },
    {
      key: "jobs",
      header: "Completed",
      render: (row) => row.completedJobs,
    },
    {
      key: "active",
      header: "Active",
      render: (row) => (
        <span className={row.isActive ? "text-ink" : "text-ink-muted"}>
          {row.isActive ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (row) => (
        <div className="flex flex-wrap gap-1">
          {row.onboardingStatus !== "APPROVED" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                reviewCleaner(row.professionalId, "approve")
              }
            >
              Approve
            </Button>
          )}
          {row.onboardingStatus !== "REJECTED" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                reviewCleaner(row.professionalId, "reject", "Needs more information")
              }
            >
              Reject
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => updateCleaner(row.professionalId, { isActive: !row.isActive })}
          >
            {row.isActive ? "Deactivate" : "Activate"}
          </Button>
        </div>
      ),
    },
  ];

  async function reviewCleaner(
    professionalId: string,
    decision: "approve" | "reject" | "suspend",
    rejectionReason?: string,
  ) {
    await fetch("/api/admin/cleaners", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ professionalId, decision, rejectionReason }),
    });
    router.refresh();
  }

  async function updateCleaner(
    professionalId: string,
    updates: { isVerified?: boolean; isActive?: boolean },
  ) {
    await fetch("/api/admin/cleaners", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ professionalId, ...updates }),
    });
    router.refresh();
  }

  async function handleBulk(action: string, ids: string[]) {
    if (action === "approve") {
      await Promise.all(
        ids.map((professionalId) =>
          fetch("/api/admin/cleaners", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ professionalId, decision: "approve" }),
          }),
        ),
      );
      router.refresh();
      return;
    }

    const updates =
      action === "verify"
        ? { isVerified: true }
        : action === "activate"
          ? { isActive: true }
          : { isActive: false };

    await fetch("/api/admin/cleaners", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bulk: true, ids, ...updates }),
    });
    router.refresh();
  }

  return (
    <AdminDataTable
      data={cleaners.map((c) => ({ ...c, id: c.professionalId }))}
      columns={columns}
      searchPlaceholder="Search cleaners..."
      searchKeys={[(r) => [r.firstName, r.lastName].filter(Boolean).join(" ")]}
      bulkActions={[
        { label: "Approve selected", action: "approve" },
        { label: "Activate selected", action: "activate" },
        { label: "Deactivate selected", action: "deactivate", variant: "ghost" },
      ]}
      onBulkAction={handleBulk}
    />
  );
}
