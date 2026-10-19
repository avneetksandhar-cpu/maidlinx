import Link from "next/link";

interface ProEmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
}

export function ProEmptyState({ title, description, actionLabel, actionHref }: ProEmptyStateProps) {
  return (
    <div className="flex flex-col items-center rounded-[var(--ml-card-radius)] border border-dashed border-[var(--ml-dark-border)] bg-[var(--ml-dark-surface)] px-5 py-12 text-center">
      <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-[var(--ml-dark-mint)]/15 text-[var(--ml-dark-mint)]">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <rect x="3" y="8" width="18" height="12" rx="2" stroke="currentColor" strokeWidth="1.75" />
          <path d="M9 8V6a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" stroke="currentColor" strokeWidth="1.75" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-[var(--ml-dark-ink)]">{title}</h3>
      <p className="mt-2 max-w-sm text-sm text-[var(--ml-dark-ink-muted)]">{description}</p>
      {actionLabel && actionHref ? (
        <Link
          href={actionHref}
          className="mt-6 inline-flex h-12 items-center justify-center rounded-2xl bg-[var(--ml-dark-mint)] px-6 text-sm font-semibold text-[var(--ml-app-header-ink)] transition-colors hover:bg-[var(--maidlinx-teal-hover)]"
        >
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}
