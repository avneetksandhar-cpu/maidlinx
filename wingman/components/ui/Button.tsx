"use client";

import { cn } from "@/lib/utils";
import { forwardRef, type ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "outline";
type ButtonSize = "sm" | "md" | "lg";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
};

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "rounded-full bg-[#FF2B8A] text-white hover:bg-[#ff4a9c] active:scale-[0.99]",
  secondary:
    "rounded-full bg-transparent text-ink border border-white/20 hover:border-white/40 active:scale-[0.99]",
  ghost: "bg-transparent text-ink-muted hover:text-ink active:scale-[0.99]",
  outline:
    "rounded-full bg-transparent text-ink border border-white/20 hover:border-[#FF2B8A]/60 active:scale-[0.99]",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "h-10 px-5 text-sm font-semibold",
  md: "h-12 px-6 text-[0.95rem] font-semibold",
  lg: "h-14 px-8 text-[0.95rem] font-semibold tracking-normal",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      fullWidth = false,
      loading = false,
      disabled,
      className,
      children,
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center gap-2 transition-[transform,background-color,box-shadow] duration-200",
          "motion-reduce:transition-none motion-reduce:active:translate-y-0 motion-reduce:active:scale-100",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          "disabled:pointer-events-none disabled:opacity-50",
          variantStyles[variant],
          sizeStyles[size],
          fullWidth && "w-full",
          className,
        )}
        {...props}
      >
        {loading ? (
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent motion-reduce:animate-none" />
        ) : null}
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";
