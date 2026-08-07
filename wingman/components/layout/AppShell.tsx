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
};

export function AppShell({
  children,
  className,
  showNav = false,
  noPadding = false,
}: AppShellProps) {
  return (
    <div className="min-h-dvh w-full bg-black">
      <div
        className={cn(
          "relative mx-auto flex min-h-dvh w-full max-w-[430px] flex-col bg-background",
          "shadow-[0_0_80px_rgba(0,0,0,0.8)]",
          className,
        )}
      >
        <div
          className={cn(
            "flex flex-1 flex-col",
            "pt-[env(safe-area-inset-top)]",
            showNav && "pb-[calc(4.5rem+env(safe-area-inset-bottom))]",
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
