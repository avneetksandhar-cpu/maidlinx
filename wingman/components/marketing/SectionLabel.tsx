import { cn } from "@/lib/utils";

type SectionLabelProps = {
  children: React.ReactNode;
  className?: string;
};

export function SectionLabel({ children, className }: SectionLabelProps) {
  return (
    <p
      className={cn(
        "text-label font-medium text-accent tracking-[0.25em]",
        className,
      )}
    >
      {children}
    </p>
  );
}
