import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function PhoneFrame({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className="min-h-dvh w-full bg-black">
      <div className={cn("relative mx-auto flex min-h-dvh w-full max-w-[430px] flex-col bg-[#050508]", className)}>
        {children}
      </div>
    </div>
  );
}
