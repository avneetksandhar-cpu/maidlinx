"use client";

import { BottomNav } from "@/components/layout/BottomNav";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type AppShellProps = {
  children: ReactNode;
  className?: string;
  /** Show bottom tab navigation */
  showNav?: boolean;
  /** Remove default horizontal padding from content area */
  noPadding?: boolean;
  /** Wider canvas for operator / admin desks */
  wide?: boolean;
  /** White booking screens (choose / cart / confirm) */
  tone?: "dark" | "light";
};

export function AppShell({
  children,
  className,
  showNav = false,
  noPadding = false,
  wide = false,
  tone = "dark",
}: AppShellProps) {
  return (
    <div className={cn("min-h-dvh w-full", tone === "light" ? "bg-neutral-200" : "bg-background-alt")}>
      <div
        className={cn(
          "relative mx-auto flex min-h-dvh w-full flex-col",
          wide ? "max-w-[960px]" : "max-w-[430px]",
          tone === "light" ? "bg-white text-neutral-950" : "bg-background text-ink",
          "shadow-[0_0_80px_rgba(0,0,0,0.55)]",
          className,
        )}
      >
        <div
          className={cn(
            "flex flex-1 flex-col",
            "pt-[env(safe-area-inset-top)]",
            showNav && "pb-[calc(5.75rem+env(safe-area-inset-bottom))]",
            !showNav && "pb-[env(safe-area-inset-bottom)]",
            !noPadding && "px-5",
          )}
        >
          {children}
        </div>
        {showNav ? <BottomNav /> : null}
      </div>
    </div>
  );
}
