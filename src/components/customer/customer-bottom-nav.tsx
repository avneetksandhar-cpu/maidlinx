"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { routes, siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: routes.dashboard, label: "Home", icon: HomeIcon, match: "home" },
  { href: routes.dashboardBookings, label: "Bookings", icon: CalendarIcon, match: "bookings" },
  { href: routes.dashboardInvoices, label: "Payment", icon: CardIcon, match: "payment" },
  { href: siteConfig.links.help, label: "Help", icon: HelpIcon, match: "help" },
  { href: routes.dashboardProfile, label: "Account", icon: UserIcon, match: "account" },
] as const;

function isActive(pathname: string, match: (typeof NAV_ITEMS)[number]["match"]): boolean {
  if (match === "home") {
    return (
      pathname === routes.dashboard ||
      pathname === routes.account ||
      pathname.startsWith("/bookings/")
    );
  }
  if (match === "bookings") {
    return pathname.startsWith(routes.dashboardBookings) || pathname.startsWith("/bookings/");
  }
  if (match === "payment") {
    return (
      pathname.startsWith(routes.dashboardInvoices) ||
      pathname.startsWith(routes.dashboardReceipts)
    );
  }
  if (match === "help") {
    return pathname.includes("help") || pathname.includes("faq");
  }
  if (match === "account") {
    return (
      pathname.startsWith(routes.dashboardProfile) ||
      pathname.startsWith(routes.dashboardNotifications) ||
      pathname.startsWith(routes.dashboardFavorites) ||
      pathname.startsWith(routes.dashboardSavedPlaces)
    );
  }
  return false;
}

export function CustomerBottomNav() {
  const pathname = usePathname() ?? "";

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--maidlinx-border)] bg-white/95 backdrop-blur lg:hidden"
      aria-label="Customer"
    >
      <div className="mx-auto grid max-w-[430px] grid-cols-5 gap-0.5 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2">
        {NAV_ITEMS.map((item) => {
          const active = isActive(pathname, item.match);
          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-0.5 rounded-lg px-1 py-1.5 text-[10px] font-medium transition-colors",
                active ? "text-[var(--maidlinx-green)]" : "text-[var(--maidlinx-muted)]",
              )}
            >
              <item.icon className="h-5 w-5" active={active} />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function HomeIcon({ className, active }: { className?: string; active?: boolean }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
        fill={active ? "currentColor" : "none"}
        fillOpacity={active ? 0.15 : 0}
      />
    </svg>
  );
}

function CalendarIcon({ className }: { className?: string; active?: boolean }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.75" />
      <path d="M8 3v4M16 3v4M3 10h18" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

function CardIcon({ className }: { className?: string; active?: boolean }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="6" width="18" height="12" rx="2" stroke="currentColor" strokeWidth="1.75" />
      <path d="M3 10h18" stroke="currentColor" strokeWidth="1.75" />
    </svg>
  );
}

function HelpIcon({ className }: { className?: string; active?: boolean }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.75" />
      <path
        d="M9.5 9.5a2.5 2.5 0 1 1 3.6 2.25c-.7.35-1.1.9-1.1 1.75V14"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <circle cx="12" cy="17" r="0.75" fill="currentColor" />
    </svg>
  );
}

function UserIcon({ className }: { className?: string; active?: boolean }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.75" />
      <path d="M5 20a7 7 0 0 1 14 0" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}
