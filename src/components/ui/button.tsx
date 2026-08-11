import { type ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

const variants = {
  primary:
    "bg-accent text-white hover:bg-accent-hover focus-visible:ring-accent/40 disabled:bg-accent/50",
  secondary:
    "border border-border-strong bg-surface text-ink hover:bg-accent-muted focus-visible:ring-accent/40",
  ghost: "text-ink hover:bg-accent-muted focus-visible:ring-accent/40",
  gold: "bg-accent text-white hover:bg-accent-hover focus-visible:ring-accent/40 disabled:bg-accent/50",
  accent:
    "bg-accent text-white hover:bg-accent-hover focus-visible:ring-accent/40 disabled:bg-accent/50",
} as const;

const sizes = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-5 text-sm",
  lg: "h-12 px-6 text-base",
} as const;

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      fullWidth = false,
      type = "button",
      ...props
    },
    ref,
  ) => (
    <button
      ref={ref}
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70",
        variants[variant],
        sizes[size],
        fullWidth && "w-full",
        className,
      )}
      {...props}
    />
  ),
);

Button.displayName = "Button";
