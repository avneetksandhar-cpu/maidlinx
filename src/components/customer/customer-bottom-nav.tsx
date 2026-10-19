"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, CalendarDays, Home, UserRound } from "lucide-react";
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

function isInAppShell(pathname: string): boolean {
  return (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/account") ||
    pathname.startsWith("/bookings") ||
    pathname.startsWith("/profile") ||
    pathname.startsWith("/book/confirmation")
  );
}

/**
 * Persistent iOS-style bottom tabs — dark bar, mint active, safe-area inset.
 * Design-spec: Home · Bookings · Properties · Profile.
 */
export function CustomerBottomNav({
  className,
  hidden = false,
}: {
  className?: string;
  /** Force hide (e.g. immersive overlays). Path rules still apply when false. */
  hidden?: boolean;
}) {
  const pathname = usePathname() ?? "";

  if (hidden || !shouldShowCustomerTabBar(pathname)) return null;

  const homeHref = isInAppShell(pathname) ? routes.dashboard : routes.home;

  const navItems = [
    {
      href: homeHref,
      label: "Home",
      icon: Home,
      match: (path: string) =>
        path === routes.home ||
        path === routes.account ||
        path === routes.dashboard,
    },
    {
      href: routes.dashboardBookings,
      label: "Bookings",
      icon: CalendarDays,
      match: (path: string) =>
        path.startsWith(routes.dashboardBookings) ||
        path.startsWith("/bookings/") ||
        path.startsWith("/book/confirmation"),
    },
    {
      href: routes.dashboardSavedPlaces,
      label: "Properties",
      icon: Building2,
      match: (path: string) => path.startsWith(routes.dashboardSavedPlaces),
    },
    {
      href: routes.dashboardProfile,
      label: "Profile",
      icon: UserRound,
      match: (path: string) =>
        path.startsWith(routes.dashboardProfile) ||
        path.startsWith(routes.dashboardNotifications) ||
        path.startsWith(routes.dashboardFavorites) ||
        path.startsWith(routes.dashboardInvoices) ||
        path.startsWith(routes.dashboardReceipts) ||
        path.startsWith(routes.dashboardSupport) ||
        path.startsWith("/profile"),
    },
  ] as const;

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
        {navItems.map((item) => {
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
