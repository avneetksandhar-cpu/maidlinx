"use client";

import { cn } from "@/lib/utils";

export interface ChartPoint {
  label: string;
  value: number;
}

export function AdminLineChart({
  data,
  valueFormatter,
  className,
}: {
  data: ChartPoint[];
  valueFormatter?: (v: number) => string;
  className?: string;
}) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const fmt = valueFormatter ?? ((v: number) => String(v));

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex h-48 items-end gap-1 border-b border-border pb-2">
        {data.map((point) => {
          const height = (point.value / max) * 100;
          return (
            <div key={point.label} className="group flex flex-1 flex-col items-center gap-1">
              <div
                className="w-full rounded-t bg-gold/80 transition-all group-hover:bg-gold"
                style={{ height: `${Math.max(height, 2)}%` }}
                title={`${point.label}: ${fmt(point.value)}`}
              />
            </div>
          );
        })}
      </div>
      <div className="flex gap-1 overflow-hidden">
        {data.filter((_, i) => i % Math.ceil(data.length / 7) === 0).map((point) => (
          <span key={point.label} className="flex-1 truncate text-center text-[10px] text-ink-subtle">
            {point.label}
          </span>
        ))}
      </div>
    </div>
  );
}

export function AdminBarChart({
  data,
  className,
}: {
  data: ChartPoint[];
  className?: string;
}) {
  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className={cn("space-y-3", className)}>
      {data.map((point) => (
        <div key={point.label} className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-ink-muted">{point.label}</span>
            <span className="font-medium text-ink">{point.value}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-surface-muted">
            <div
              className="h-full rounded-full bg-ink transition-all"
              style={{ width: `${(point.value / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export function AdminDonutChart({
  data,
  className,
}: {
  data: ChartPoint[];
  className?: string;
}) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const colors = ["#0f1f3d", "#0d9488", "#4a5568", "#718096", "#14b8a6", "#e2e8f0"];

  let cumulative = 0;
  const segments = data.map((point, i) => {
    const pct = point.value / total;
    const start = cumulative;
    cumulative += pct;
    return { ...point, start, pct, color: colors[i % colors.length] };
  });

  const gradient = segments
    .map((s) => `${s.color} ${s.start * 360}deg ${(s.start + s.pct) * 360}deg`)
    .join(", ");

  return (
    <div className={cn("flex flex-wrap items-center gap-6", className)}>
      <div
        className="h-36 w-36 shrink-0 rounded-full"
        style={{ background: total > 0 ? `conic-gradient(${gradient})` : "#e5e5e5" }}
      />
      <div className="space-y-2">
        {data.map((point, i) => (
          <div key={point.label} className="flex items-center gap-2 text-sm">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: colors[i % colors.length] }}
            />
            <span className="text-ink-muted">{point.label}</span>
            <span className="font-medium text-ink">{point.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
