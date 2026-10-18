import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function EmptyState({
  title,
  body,
  action,
  className,
}: {
  title: string;
  body?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("px-1 py-10", className)}>
      <h3 className="text-2xl font-semibold">{title}</h3>
      {body ? <p className="mt-3 max-w-sm text-[0.95rem] leading-relaxed opacity-70">{body}</p> : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
