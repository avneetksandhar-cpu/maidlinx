import { Heading, Text } from "@/components/ui";

interface AdminHeaderProps {
  title: string;
  description?: string;
  badge?: string;
}

export function AdminHeader({ title, description, badge }: AdminHeaderProps) {
  return (
    <div className="mb-8 border-b border-border pb-6">
      <div className="flex flex-wrap items-center gap-3">
        <Heading as="h1" className="text-3xl">
          {title}
        </Heading>
        {badge && (
          <span className="rounded-md bg-ink px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-white">
            {badge}
          </span>
        )}
      </div>
      {description && (
        <Text muted className="mt-2 max-w-3xl">
          {description}
        </Text>
      )}
    </div>
  );
}

interface AdminStatCardProps {
  label: string;
  value: string | number;
  sublabel?: string;
  trend?: string;
}

export function AdminStatCard({ label, value, sublabel, trend }: AdminStatCardProps) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5 shadow-card">
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-subtle">{label}</p>
      <p className="mt-2 font-display text-3xl font-semibold text-ink">{value}</p>
      {(sublabel || trend) && (
        <p className="mt-1 text-sm text-ink-muted">
          {trend && <span className="text-gold">{trend} </span>}
          {sublabel}
        </p>
      )}
    </div>
  );
}
