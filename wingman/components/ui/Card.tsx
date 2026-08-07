import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

export type CardProps = HTMLAttributes<HTMLDivElement> & {
  variant?: "default" | "elevated" | "outline" | "gold-top";
  padding?: "none" | "sm" | "md" | "lg";
};

const variantStyles = {
  default: "bg-surface border border-border",
  elevated:
    "bg-surface-elevated border border-border-subtle shadow-lg shadow-black/40",
  outline: "bg-transparent border border-border-subtle",
  "gold-top": "gold-top-border bg-surface",
};

const paddingStyles = {
  none: "",
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
};

export function Card({
  variant = "default",
  padding = "md",
  className,
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        "rounded-lg",
        variantStyles[variant],
        paddingStyles[padding],
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
