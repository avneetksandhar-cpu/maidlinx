interface AdminHeaderProps {
  title: string;
  description?: string;
  badge?: string;
}

export function AdminHeader({ title, description, badge }: AdminHeaderProps) {
  return (
    <div className="mb-6 border-b border-[var(--ml-dark-border)] pb-5">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--ml-dark-ink)] sm:text-3xl">
          {title}
        </h1>
        {badge ? (
          <span className="rounded-md bg-[var(--ml-dark-mint)]/15 px-2.5 py-1 text-xs font-semibold tracking-wide text-[var(--ml-dark-mint)] uppercase">
            {badge}
          </span>
        ) : null}
      </div>
      {description ? (
        <p className="mt-2 max-w-3xl text-sm text-[var(--ml-dark-ink-muted)]">{description}</p>
      ) : null}
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
    <div className="rounded-[var(--ml-card-radius)] border border-[var(--ml-dark-border)] bg-[var(--ml-dark-surface)] p-5 shadow-[var(--shadow-card)]">
      <p className="text-xs font-semibold tracking-wide text-[var(--ml-dark-ink-subtle)] uppercase">
        {label}
      </p>
      <p className="mt-2 text-3xl font-semibold text-[var(--ml-dark-ink)]">{value}</p>
      {sublabel || trend ? (
        <p className="mt-1 text-sm text-[var(--ml-dark-ink-muted)]">
          {trend ? <span className="text-[var(--ml-dark-mint)]">{trend} </span> : null}
          {sublabel}
        </p>
      ) : null}
    </div>
  );
}
