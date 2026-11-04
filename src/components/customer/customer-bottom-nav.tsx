"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, CalendarDays, CreditCard, LayoutGrid } from "lucide-react";
import { routes } from "@/config/site";
import { cn } from "@/lib/utils";

/**
 * Where the customer iOS tab bar should appear.
 * Hide on mid-funnel `/book/*` slides so one-decision screens stay clean;
 * show on overview / sites / jobs / billing and live booking status.
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

/**
 * Persistent iOS-style bottom tabs — midnight navy, turquoise active.
 * Overview · Sites · Jobs · Billing (commercial primary).
 * Residential Home booking remains at `/` as a secondary path.
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

  const navItems = [
    {
      href: routes.dashboard,
      label: "Overview",
      icon: LayoutGrid,
      match: (path: string) =>
        path === routes.dashboard || path.startsWith(routes.dashboardBook),
    },
    {
      href: routes.dashboardSites,
      label: "Sites",
      icon: Building2,
      match: (path: string) =>
        path.startsWith(routes.dashboardSites) ||
        path.startsWith(routes.dashboardSavedPlaces),
    },
    {
      href: routes.dashboardJobs,
      label: "Jobs",
      icon: CalendarDays,
      match: (path: string) =>
        path.startsWith(routes.dashboardJobs) ||
        path.startsWith(routes.dashboardBookings) ||
        path.startsWith("/bookings/") ||
        path.startsWith("/book/confirmation"),
    },
    {
      href: routes.dashboardBilling,
      label: "Billing",
      icon: CreditCard,
      match: (path: string) =>
        path.startsWith(routes.dashboardBilling) ||
        path.startsWith(routes.dashboardInvoices) ||
        path.startsWith(routes.dashboardReceipts) ||
        path.startsWith(routes.dashboardProfile) ||
        path.startsWith(routes.dashboardNotifications) ||
        path.startsWith(routes.account) ||
        path.startsWith("/profile"),
    },
  ] as const;

  return (
    <nav
      aria-label="Customer"
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[#01193D]/97 backdrop-blur-md lg:hidden",
        className,
      )}
      style={{
        fontFamily:
          "-apple-system, BlinkMacSystemFont, system-ui, sans-serif",
      }}
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
                  ? "text-[#04CED2]"
                  : "text-white/55 active:text-white/80",
              )}
            >
              <Icon
                className="size-6"
                strokeWidth={active ? 2.35 : 1.75}
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
