import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

export type CardProps = HTMLAttributes<HTMLDivElement> & {
  variant?: "default" | "elevated" | "outline" | "gold-top";
  padding?: "none" | "sm" | "md" | "lg";
};

const variantStyles = {
  default: "card-glow bg-surface rounded-2xl",
  elevated:
    "card-glow bg-surface-elevated rounded-2xl shadow-lg shadow-black/40",
  outline: "bg-transparent border border-border-subtle rounded-2xl",
  "gold-top": "card-glow bg-surface rounded-2xl",
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
        "rounded-2xl",
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
