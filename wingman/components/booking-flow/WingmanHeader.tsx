"use client";

import { WingmanLogo } from "@/components/brand/WingmanLogo";
import { cn } from "@/lib/utils";
import Link from "next/link";

export function WingmanHeader({
  compact = false,
  className,
}: {
  compact?: boolean;
  subtitle?: string;
  className?: string;
}) {
  return (
    <Link href="/home" className={cn("flex flex-col items-center", className)} aria-label="Wingman home">
      <WingmanLogo size={compact ? 32 : 48} title="Wingman" />
      <p className="mt-3 text-[13px] font-medium tracking-[0.16em] text-white/90">WINGMAN</p>
    </Link>
  );
}
