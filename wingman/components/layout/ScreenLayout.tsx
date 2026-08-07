import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type ScreenLayoutProps = {
  children: ReactNode;
  className?: string;
  /** Constrain to mobile-width column on larger screens */
  centered?: boolean;
  /** Remove default horizontal padding */
  noPadding?: boolean;
  /** Safe area for notched devices */
  safeArea?: boolean;
};

export function ScreenLayout({
  children,
  className,
  centered = true,
  noPadding = false,
  safeArea = true,
}: ScreenLayoutProps) {
  return (
    <div
      className={cn(
        "min-h-dvh w-full bg-background",
        safeArea && "pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]",
        className,
      )}
    >
      <div
        className={cn(
          "mx-auto min-h-dvh w-full",
          centered && "max-w-lg",
          !noPadding && "px-6",
        )}
      >
        {children}
      </div>
    </div>
  );
}
