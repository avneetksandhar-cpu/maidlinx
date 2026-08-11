import { type TextareaHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, invalid = false, ...props }, ref) => (
    <textarea
      ref={ref}
      aria-invalid={invalid}
      className={cn(
        "flex min-h-28 w-full rounded-lg border bg-surface px-4 py-3 text-sm text-ink transition-colors placeholder:text-ink-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 disabled:cursor-not-allowed disabled:opacity-60",
        invalid ? "border-error focus-visible:ring-error/20" : "border-border",
        className,
      )}
      {...props}
    />
  ),
);

Textarea.displayName = "Textarea";
