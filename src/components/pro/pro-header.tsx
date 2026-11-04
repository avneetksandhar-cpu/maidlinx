interface ProHeaderProps {
  title: string;
  description?: string;
  badge?: string;
}

export function ProHeader({ title, description, badge }: ProHeaderProps) {
  return (
    <div className="mb-6 px-4 pt-4 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--ml-dark-ink)]">
          {title}
        </h1>
        {badge ? (
          <span className="rounded-full bg-[var(--ml-dark-mint)]/15 px-3 py-1 text-xs font-semibold tracking-wide text-[var(--ml-dark-mint)] uppercase">
            {badge}
          </span>
        ) : null}
      </div>
      {description ? (
        <p className="mt-2 max-w-2xl text-sm text-[var(--ml-dark-ink-muted)]">{description}</p>
      ) : null}
    </div>
  );
}
