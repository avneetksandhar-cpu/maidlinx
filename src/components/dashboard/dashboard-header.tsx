interface DashboardHeaderProps {
  title: string;
  description?: string;
}

export function DashboardHeader({ title, description }: DashboardHeaderProps) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-semibold tracking-tight text-[var(--ml-dark-ink)]">{title}</h1>
      {description ? (
        <p className="mt-2 max-w-2xl text-sm text-[var(--ml-dark-ink-muted)]">{description}</p>
      ) : null}
    </div>
  );
}
