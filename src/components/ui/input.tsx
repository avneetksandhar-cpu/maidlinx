import { type InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, invalid = false, type = "text", ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      aria-invalid={invalid}
      className={cn(
        "flex h-11 w-full rounded-lg border bg-surface px-4 text-sm text-ink transition-colors placeholder:text-ink-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 disabled:cursor-not-allowed disabled:opacity-60",
        invalid ? "border-error focus-visible:ring-error/20" : "border-border",
        className,
      )}
      {...props}
    />
  ),
);

Input.displayName = "Input";
