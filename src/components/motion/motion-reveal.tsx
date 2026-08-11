import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface MotionRevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

/** Lightweight reveal wrapper — CSS only, no animation library. */
export function MotionReveal({ children, className }: MotionRevealProps) {
  return <div className={cn(className)}>{children}</div>;
}
