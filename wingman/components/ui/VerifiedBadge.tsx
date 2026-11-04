import { cn } from "@/lib/utils";

export function VerifiedBadge({ className, label = "Verified" }: { className?: string; label?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-border-gold bg-accent-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-accent",
        className,
      )}
    >
      <svg viewBox="0 0 20 20" className="h-3 w-3" fill="currentColor" aria-hidden>
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
          clipRule="evenodd"
        />
      </svg>
      {label}
    </span>
  );
}
