"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, CalendarDays, Sparkles, UserRound } from "lucide-react";
import { routes } from "@/config/site";
import { cn } from "@/lib/utils";

const ITEMS = [
  { label: "Home", href: routes.home, icon: Home, match: (p: string) => p === routes.home },
  {
    label: "Bookings",
    href: routes.dashboardBookings,
    icon: CalendarDays,
    match: (p: string) => p.startsWith(routes.dashboardBookings) || p.startsWith("/dashboard"),
  },
  {
    label: "MaidLinx",
    href: routes.book,
    icon: Sparkles,
    match: (p: string) => p === routes.book || p.startsWith(`${routes.book}/`),
    primary: true,
  },
  {
    label: "Account",
    href: routes.dashboardProfile,
    icon: UserRound,
    match: (p: string) => p.startsWith(routes.signIn) || p.startsWith(routes.dashboardProfile),
  },
] as const;

interface MobileBottomNavProps {
  className?: string;
  /** Hide on booking wizard sticky footer steps when needed */
  hidden?: boolean;
}

export function MobileBottomNav({ className, hidden = false }: MobileBottomNavProps) {
  const pathname = usePathname() ?? "";

  if (hidden) return null;

  return (
    <nav
      aria-label="Primary mobile"
      className={cn(
        "fixed inset-x-0 bottom-0 z-30 border-t border-border/70 bg-surface/98 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden",
        className,
      )}
    >
      <ul className="mx-auto grid h-16 max-w-lg grid-cols-4">
        {ITEMS.map((item) => {
          const active = item.match(pathname);
          const Icon = item.icon;
          const primary = "primary" in item && item.primary;
          return (
            <li key={item.label}>
              <Link
                href={item.href}
                className={cn(
                  "flex h-full flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors",
                  active ? "text-accent" : "text-ink-muted",
                  primary && !active && "text-navy",
                )}
              >
                <span
                  className={cn(
                    "flex size-9 items-center justify-center rounded-full transition-colors",
                    primary && "bg-accent text-white",
                    primary && active && "bg-accent-hover",
                    !primary && active && "bg-accent-muted",
                  )}
                >
                  <Icon className="size-5" strokeWidth={primary ? 2.25 : 2} aria-hidden />
                </span>
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
