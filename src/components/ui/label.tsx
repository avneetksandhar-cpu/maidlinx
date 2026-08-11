import { type LabelHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

export function Label({ className, children, required = false, ...props }: LabelProps) {
  return (
    <label
      className={cn("mb-2 block text-sm font-medium text-ink", className)}
      {...props}
    >
      {children}
      {required ? <span className="ml-1 text-accent">*</span> : null}
    </label>
  );
}
