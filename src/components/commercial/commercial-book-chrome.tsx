"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import { BrandLockup } from "@/components/brand/brand-lockup";
import { routes } from "@/config/site";
import { cn } from "@/lib/utils";

/**
 * Compact header matching mockup: circular logo + MaidLinx left, bell right.
 * Used inside dashboard book routes when BusinessShell already wraps — optional
 * standalone chrome for step pages that want the mockup lockup inline.
 */
export function CommercialBookTopBar({
  className,
  showBell = true,
}: {
  className?: string;
  showBell?: boolean;
}) {
  return (
    <div
      className={cn(
        "mb-4 flex items-center justify-between gap-3 lg:hidden",
        className,
      )}
    >
      <BrandLockup href={routes.dashboardBook} size="default" tone="onDark" priority />
      {showBell ? (
        <Link
          href={routes.dashboardNotifications}
          className="inline-flex size-11 items-center justify-center rounded-xl text-white/90 transition-colors hover:bg-white/10"
          aria-label="Notifications"
        >
          <Bell className="size-5" strokeWidth={1.75} aria-hidden />
        </Link>
      ) : (
        <span className="size-11" aria-hidden />
      )}
    </div>
  );
}

export function CommercialCtaButton({
  children,
  disabled,
  onClick,
  href,
  type = "button",
}: {
  children: React.ReactNode;
  disabled?: boolean;
  onClick?: () => void;
  href?: string;
  type?: "button" | "submit";
}) {
  const className = cn(
    "inline-flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#04CED2] text-base font-semibold text-[#01193D] transition-opacity",
    disabled ? "pointer-events-none opacity-40" : "hover:opacity-95",
  );
  if (href && !disabled) {
    return (
      <Link href={href} className={className}>
        {children}
      </Link>
    );
  }
  return (
    <button type={type} className={className} disabled={disabled} onClick={onClick}>
      {children}
    </button>
  );
}
