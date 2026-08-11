import { type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface ContainerProps extends HTMLAttributes<HTMLDivElement> {
  narrow?: boolean;
}

export function Container({ narrow = false, className, ...props }: ContainerProps) {
  return (
    <div
      className={cn(narrow ? "container-narrow" : "container-app", className)}
      {...props}
    />
  );
}

export function Section({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return (
    <section
      className={cn("py-[var(--spacing-section)] lg:py-[var(--spacing-section-lg)]", className)}
      {...props}
    />
  );
}
