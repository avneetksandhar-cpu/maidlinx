import { Suspense } from "react";
import { AdminDataTable, type Column } from "@/components/admin/admin-data-table";
import { AdminHeader } from "@/components/admin/admin-header";
import { getSystemLogs } from "@/lib/admin/audit";
import { requireAdminPermission } from "@/lib/admin/session";
import { formatAdminDate } from "@/lib/admin/display";

export const metadata = { title: "Logs" };

interface LogRow {
  id: string;
  level: string;
  source: string;
  message: string;
  createdAt: string;
}

async function LogsContent() {
  await requireAdminPermission("logs.read");
  const logs = await getSystemLogs(200);

  const columns: Column<LogRow>[] = [
    {
      key: "level",
      header: "Level",
      render: (row) => (
        <span
          className={
            row.level === "error"
              ? "text-error"
              : row.level === "warn"
                ? "text-gold"
                : "text-ink-muted"
          }
        >
          {row.level.toUpperCase()}
        </span>
      ),
    },
    { key: "source", header: "Source", render: (row) => row.source },
    { key: "message", header: "Message", render: (row) => row.message },
    { key: "time", header: "Time", render: (row) => formatAdminDate(row.createdAt) },
  ];

  const rows: LogRow[] = logs.map((log) => ({
    id: log.id,
    level: log.level,
    source: log.source,
    message: log.message,
    createdAt: log.createdAt,
  }));

  return (
    <>
      <AdminHeader title="System logs" description="Application events, errors, and operational logs." />
      <AdminDataTable
        data={rows}
        columns={columns}
        searchPlaceholder="Search logs..."
        searchKeys={[(r) => r.message, (r) => r.source]}
        filters={[
          { id: "error", label: "Error", value: "error" },
          { id: "warn", label: "Warn", value: "warn" },
          { id: "info", label: "Info", value: "info" },
        ]}
        filterKey="level"
        emptyMessage="No system logs yet."
      />
    </>
  );
}

export default function AdminLogsPage() {
  return (
    <div className="px-4 py-8 sm:px-6 lg:px-10">
      <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-border" />}>
        <LogsContent />
      </Suspense>
    </div>
  );
}
