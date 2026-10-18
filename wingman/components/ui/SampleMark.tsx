import { cn } from "@/lib/utils";

export function SampleMark({
  children = "Sample",
  className,
}: {
  children?: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-accent/35 bg-accent-muted px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-accent",
        className,
      )}
    >
      {children}
    </span>
  );
}
