export function OwnerStat({
  label,
  value,
  sublabel,
  estimate,
  unavailable,
}: {
  label: string;
  value: string | number | null | undefined;
  sublabel?: string;
  estimate?: boolean;
  unavailable?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4 shadow-card">
      <p className="text-xs text-ink-muted">{label}</p>
      <p className="mt-1 font-display text-xl font-semibold text-ink">
        {unavailable || value == null || value === "" ? "—" : value}
      </p>
      {(sublabel || estimate || unavailable) && (
        <p className="mt-1 text-[11px] text-ink-subtle">
          {unavailable
            ? "Unavailable / gap"
            : estimate
              ? `${sublabel ? `${sublabel} · ` : ""}estimate`
              : sublabel}
        </p>
      )}
    </div>
  );
}
