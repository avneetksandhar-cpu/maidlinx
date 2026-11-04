"use client";

import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes } from "react";

export function PrimaryButton({
  className,
  loading,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean }) {
  return (
    <button
      type="button"
      {...props}
      disabled={props.disabled || loading}
      className={cn(
        "inline-flex h-12 w-full items-center justify-center rounded-[16px] bg-[#00C2FF] px-5 text-[16px] font-medium text-[#050508]",
        "transition-opacity duration-200 active:opacity-80",
        "disabled:opacity-30",
        className,
      )}
    >
      {loading ? (
        <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-[#050508] border-t-transparent" />
      ) : null}
      {children}
    </button>
  );
}
