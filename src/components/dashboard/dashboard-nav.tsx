"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { SiteLogo } from "@/components/brand/site-logo";
import { ThemeToggle } from "@/components/dashboard/theme-toggle";
import { PlatformUserMenu } from "@/components/layout/platform-user-menu";
import { Button } from "@/components/ui";
import { routes } from "@/config/site";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: routes.dashboard, label: "Overview", icon: HomeIcon },
  { href: routes.dashboardBookings, label: "Bookings", icon: CalendarIcon },
  { href: routes.dashboardSavedPlaces, label: "Saved Places", icon: PinIcon },
  { href: routes.dashboardReceipts, label: "Receipts", icon: ReceiptIcon },
  { href: routes.dashboardFavorites, label: "Favorites", icon: HeartIcon },
  { href: routes.dashboardReferrals, label: "Referrals", icon: GiftIcon },
  { href: routes.dashboardSupport, label: "Support", icon: SupportIcon },
  { href: routes.dashboardInvoices, label: "Invoices", icon: InvoiceIcon },
  { href: routes.dashboardProfile, label: "Profile", icon: UserIcon },
  { href: routes.dashboardNotifications, label: "Notifications", icon: BellIcon },
] as const;

export function DashboardNav() {
  const pathname = usePathname() ?? "";
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border bg-surface/95 backdrop-blur lg:hidden">
        <div className="flex h-14 items-center justify-between px-4">
          <SiteLogo variant="mark" />
          <div className="flex items-center gap-1">
            <ThemeToggle compact />
            <Button
              variant="ghost"
              size="sm"
              className="h-9 w-9 px-0"
              aria-label="Open menu"
              onClick={() => setMobileOpen(true)}
            >
              <MenuIcon />
            </Button>
          </div>
        </div>
      </header>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-ink/40"
            aria-label="Close menu"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex w-72 flex-col bg-surface shadow-elevated">
            <div className="flex h-14 items-center justify-between border-b border-border px-4">
              <span className="font-display font-semibold text-ink">Menu</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-9 w-9 px-0"
                aria-label="Close menu"
                onClick={() => setMobileOpen(false)}
              >
                <CloseIcon />
              </Button>
            </div>
            <NavLinks pathname={pathname} onNavigate={() => setMobileOpen(false)} />
            <div className="mt-auto border-t border-border p-4">
              <PlatformUserMenu />
            </div>
          </aside>
        </div>
      )}

      <aside className="hidden w-64 shrink-0 border-r border-border bg-surface lg:flex lg:flex-col">
        <div className="flex h-16 items-center border-b border-border px-6">
          <SiteLogo variant="horizontal" />
        </div>
        <NavLinks pathname={pathname} />
        <div className="mt-auto space-y-2 border-t border-border p-4">
          <ThemeToggle className="w-full justify-start" />
          <div className="flex items-center justify-between px-1">
            <span className="text-sm text-ink-muted">Account</span>
            <PlatformUserMenu />
          </div>
        </div>
      </aside>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 backdrop-blur lg:hidden">
        <div className="grid grid-cols-5 gap-1 px-2 py-2">
          {NAV_ITEMS.slice(0, 5).map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-0.5 rounded-lg px-1 py-1.5 text-[10px] font-medium transition-colors",
                  active ? "text-accent" : "text-ink-muted",
                )}
              >
                <item.icon className="h-5 w-5" />
                <span className="truncate">{item.label.split(" ")[0]}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}

function NavLinks({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <nav className="flex-1 space-y-1 p-3">
      {NAV_ITEMS.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-accent-muted text-ink"
                : "text-ink-muted hover:bg-surface-muted hover:text-ink",
            )}
          >
            <item.icon className="h-5 w-5 shrink-0" />
            {item.label}
          </Link>
        );
      })}
      <Link
        href={routes.book}
        onClick={onNavigate}
        className="mt-4 flex items-center justify-center gap-2 rounded-full bg-ink px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-neutral-800"
      >
        Book a clean
      </Link>
    </nav>
  );
}

function isActive(pathname: string, href: string): boolean {
  if (href === routes.dashboard) return pathname === href;
  return pathname.startsWith(href);
}

function HomeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" />
    </svg>
  );
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.75" />
      <path d="M8 3v4M16 3v4M3 10h18" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

function InvoiceIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M8 4h8l4 4v12a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" />
      <path d="M16 4v4h4M9 13h6M9 17h4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

function ReceiptIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 3h12v18l-2-1.5L14 21l-2-1.5L10 21l-2-1.5L6 21V3Z" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" />
      <path d="M9 8h6M9 12h6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

function HeartIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 20s-7-4.5-7-9.5a4 4 0 0 1 7-2.5 4 4 0 0 1 7 2.5C19 15.5 12 20 12 20Z" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" />
    </svg>
  );
}

function GiftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 8v13M4 12h16M5 8h14v13H5V8Z" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" />
      <path d="M12 8c-2-3-5-3-5-1s2 2 5 1c3 1 5 0 5-1s-3-2-5 1Z" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" />
    </svg>
  );
}

function SupportIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.75" />
      <path d="M9.5 9.5a2.5 2.5 0 1 1 4.2 1.8c-.7.6-1.2 1-1.2 2.2M12 17h.01" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

function PinIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 21s7-5.2 7-11a7 7 0 1 0-14 0c0 5.8 7 11 7 11Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.75" />
    </svg>
  );
}

function UserIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.75" />
      <path d="M5 20a7 7 0 0 1 14 0" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

function BellIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 4a5 5 0 0 0-5 5v3l-1.5 3H18.5L17 12V9a5 5 0 0 0-5-5Z" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" />
      <path d="M10 20a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}
