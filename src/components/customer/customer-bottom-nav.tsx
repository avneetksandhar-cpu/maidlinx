"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Home, LifeBuoy, UserRound } from "lucide-react";
import { routes } from "@/config/site";
import { cn } from "@/lib/utils";

/**
 * Where the customer iOS tab bar should appear.
 * Hide on mid-funnel `/book/*` slides so one-decision screens stay clean;
 * show on home, dashboard/account, live booking status, and confirmation.
 */
export function shouldShowCustomerTabBar(pathname: string): boolean {
  if (pathname.startsWith("/book/confirmation")) return true;
  if (pathname === "/book" || pathname.startsWith("/book/")) return false;
  if (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/owner") ||
    pathname.startsWith("/pro") ||
    pathname.startsWith("/cleaner") ||
    pathname.startsWith("/sign-") ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/reset-password") ||
    pathname.startsWith("/legal") ||
    pathname === "/earn" ||
    pathname.startsWith("/earn/") ||
    pathname === "/for-business" ||
    pathname.startsWith("/onboarding")
  ) {
    return false;
  }
  return (
    pathname === routes.home ||
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/account") ||
    pathname.startsWith("/bookings") ||
    pathname.startsWith("/profile")
  );
}

const NAV_ITEMS = [
  {
    href: routes.home,
    label: "Home",
    icon: Home,
    match: (pathname: string) =>
      pathname === routes.home ||
      pathname === routes.account ||
      pathname === routes.dashboard,
  },
  {
    href: routes.dashboardBookings,
    label: "Bookings",
    icon: CalendarDays,
    match: (pathname: string) =>
      pathname.startsWith(routes.dashboardBookings) ||
      pathname.startsWith("/bookings/") ||
      pathname.startsWith("/book/confirmation"),
  },
  {
    href: routes.dashboardSupport,
    label: "Support",
    icon: LifeBuoy,
    match: (pathname: string) =>
      pathname.startsWith(routes.dashboardSupport) ||
      pathname.includes("/help") ||
      pathname.includes("/faq"),
  },
  {
    href: routes.dashboardProfile,
    label: "Account",
    icon: UserRound,
    match: (pathname: string) =>
      pathname.startsWith(routes.dashboardProfile) ||
      pathname.startsWith(routes.dashboardNotifications) ||
      pathname.startsWith(routes.dashboardFavorites) ||
      pathname.startsWith(routes.dashboardSavedPlaces) ||
      pathname.startsWith(routes.dashboardInvoices) ||
      pathname.startsWith(routes.dashboardReceipts) ||
      pathname.startsWith("/profile"),
  },
] as const;

interface CustomerBottomNavProps {
  className?: string;
  /** Force hide (e.g. immersive overlays). Path rules still apply when false. */
  hidden?: boolean;
}

/**
 * Persistent iOS-style bottom tabs — dark bar, mint active, safe-area inset.
 * Uber-like: Home · Bookings · Support · Account.
 */
export function CustomerBottomNav({ className, hidden = false }: CustomerBottomNavProps) {
  const pathname = usePathname() ?? "";

  if (hidden || !shouldShowCustomerTabBar(pathname)) return null;

  return (
    <nav
      aria-label="Customer"
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 border-t border-[var(--ml-dark-border)] bg-[var(--ml-dark-bg)]/95 backdrop-blur-md lg:hidden",
        className,
      )}
      style={{ fontFamily: "var(--ml-font-ios)" }}
    >
      <div className="mx-auto grid h-[3.75rem] max-w-lg grid-cols-4 px-1 pb-[max(0.35rem,env(safe-area-inset-bottom))] pt-1">
        {NAV_ITEMS.map((item) => {
          const active = item.match(pathname);
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-xl px-1 text-[10px] font-medium tracking-wide transition-colors",
                active
                  ? "text-[var(--ml-dark-mint)]"
                  : "text-[var(--ml-dark-ink-muted)] active:text-[var(--ml-dark-ink)]",
              )}
            >
              <Icon
                className="size-6"
                strokeWidth={active ? 2.35 : 1.85}
                aria-hidden
              />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
