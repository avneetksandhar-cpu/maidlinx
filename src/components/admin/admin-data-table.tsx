"use client";

import { useMemo, useState } from "react";
import { Button, Input } from "@/components/ui";
import { cn } from "@/lib/utils";

export interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => React.ReactNode;
  className?: string;
}

export interface FilterOption {
  id: string;
  label: string;
  value: string;
}

interface AdminDataTableProps<T extends { id: string }> {
  data: T[];
  columns: Column<T>[];
  searchPlaceholder?: string;
  searchKeys?: Array<(row: T) => string | null | undefined>;
  filters?: FilterOption[];
  filterKey?: keyof T;
  bulkActions?: Array<{
    label: string;
    action: string;
    variant?: "primary" | "secondary" | "ghost";
  }>;
  onBulkAction?: (action: string, ids: string[]) => void | Promise<void>;
  onSearch?: (query: string) => void;
  emptyMessage?: string;
  headerExtra?: React.ReactNode;
}

export function AdminDataTable<T extends { id: string }>({
  data,
  columns,
  searchPlaceholder = "Search...",
  searchKeys = [],
  filters = [],
  filterKey,
  bulkActions = [],
  onBulkAction,
  emptyMessage = "No results found.",
  headerExtra,
}: AdminDataTableProps<T>) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);

  const filtered = useMemo(() => {
    let rows = data;

    if (filterKey && filter !== "all") {
      rows = rows.filter((row) => String(row[filterKey]) === filter);
    }

    if (search.trim() && searchKeys.length > 0) {
      const q = search.toLowerCase();
      rows = rows.filter((row) =>
        searchKeys.some((keyFn) => keyFn(row)?.toLowerCase().includes(q)),
      );
    }

    return rows;
  }, [data, search, filter, filterKey, searchKeys]);

  const allSelected = filtered.length > 0 && filtered.every((r) => selected.has(r.id));

  function toggleAll() {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((r) => r.id)));
    }
  }

  function toggleRow(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleBulk(action: string) {
    if (!onBulkAction || selected.size === 0) return;
    setBulkLoading(true);
    try {
      await onBulkAction(action, Array.from(selected));
      setSelected(new Set());
    } finally {
      setBulkLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={searchPlaceholder}
          className="max-w-xs"
        />
        {filters.length > 0 && (
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="h-11 rounded-lg border border-border bg-surface px-3 text-sm text-ink"
          >
            <option value="all">All statuses</option>
            {filters.map((f) => (
              <option key={f.id} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        )}
        {headerExtra}
        <span className="text-sm text-ink-muted">
          {filtered.length} result{filtered.length === 1 ? "" : "s"}
        </span>
      </div>

      {selected.size > 0 && bulkActions.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-gold/30 bg-gold-muted/30 px-4 py-3">
          <span className="text-sm font-medium text-ink">{selected.size} selected</span>
          {bulkActions.map((ba) => (
            <Button
              key={ba.action}
              variant={ba.variant ?? "secondary"}
              size="sm"
              disabled={bulkLoading}
              onClick={() => handleBulk(ba.action)}
            >
              {ba.label}
            </Button>
          ))}
          <Button variant="ghost" size="sm" onClick={() => setSelected(new Set())}>
            Clear
          </Button>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-border bg-surface shadow-card">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-surface-muted">
              {bulkActions.length > 0 && (
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    className="accent-gold"
                    aria-label="Select all"
                  />
                </th>
              )}
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn("px-4 py-3 font-medium text-ink-muted", col.className)}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (bulkActions.length > 0 ? 1 : 0)}
                  className="px-4 py-12 text-center text-ink-muted"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              filtered.map((row) => (
                <tr key={row.id} className="border-b border-border last:border-0 hover:bg-surface-muted/50">
                  {bulkActions.length > 0 && (
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selected.has(row.id)}
                        onChange={() => toggleRow(row.id)}
                        className="accent-gold"
                        aria-label={`Select ${row.id}`}
                      />
                    </td>
                  )}
                  {columns.map((col) => (
                    <td key={col.key} className={cn("px-4 py-3 text-ink", col.className)}>
                      {col.render(row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
