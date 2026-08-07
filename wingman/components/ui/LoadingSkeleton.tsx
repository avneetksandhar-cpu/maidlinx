import { cn } from "@/lib/utils";

type LoadingSkeletonProps = {
  className?: string;
  variant?: "text" | "circular" | "rectangular";
};

export function LoadingSkeleton({
  className,
  variant = "rectangular",
}: LoadingSkeletonProps) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={cn(
        "animate-pulse bg-surface-elevated",
        variant === "text" && "h-4 rounded-md",
        variant === "circular" && "rounded-full",
        variant === "rectangular" && "rounded-xl",
        className,
      )}
    />
  );
}

export function LoadingSkeletonGroup({ count = 3 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <LoadingSkeleton key={i} className="h-16 w-full" />
      ))}
    </div>
  );
}
