"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { SiteLogo } from "@/components/brand/site-logo";
import { PlatformUserMenu } from "@/components/layout/platform-user-menu";
import { Button } from "@/components/ui";
import { routes } from "@/config/site";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: routes.dashboard, label: "Dashboard", exact: true },
  { href: routes.dashboardBookings, label: "Bookings" },
  { href: routes.dashboardSavedPlaces, label: "Properties" },
  { href: routes.dashboardInvoices, label: "Invoices" },
  { href: routes.dashboardProfile, label: "Team" },
  { href: routes.dashboardNotifications, label: "Settings" },
] as const;

function isActive(pathname: string, href: string, exact?: boolean): boolean {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

interface BusinessShellProps {
  children: React.ReactNode;
  firstName?: string;
}

/**
 * B2B / multi-property customer chrome — dark navy sidebar (design-spec).
 * Residential customers keep CustomerShell instead.
 */
export function BusinessShell({ children, firstName }: BusinessShellProps) {
  const pathname = usePathname() ?? "";
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-dvh bg-background text-ink">
      {/* Desktop dark sidebar */}
      <aside className="hidden w-60 shrink-0 flex-col bg-navy text-white lg:flex">
        <div className="flex h-16 items-center px-5">
          <SiteLogo variant="horizontal" tone="onDark" href={routes.dashboard} />
        </div>
        <nav className="flex flex-1 flex-col gap-0.5 px-3 py-2">
          {NAV_ITEMS.map((item) => {
            const active = isActive(pathname, item.href, "exact" in item ? item.exact : false);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-accent text-accent-foreground"
                    : "text-white/75 hover:bg-white/10 hover:text-white",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto border-t border-white/10 p-4">
          <p className="truncate text-sm font-medium text-white">
            {firstName?.trim() || "Account"}
          </p>
          <p className="mt-0.5 text-xs text-white/55">Business</p>
          <div className="mt-3">
            <PlatformUserMenu />
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border bg-surface/95 px-4 backdrop-blur lg:hidden">
          <SiteLogo variant="mark" href={routes.dashboard} />
          <Button
            variant="ghost"
            size="sm"
            className="h-9 w-9 px-0"
            aria-label="Open menu"
            onClick={() => setMobileOpen(true)}
          >
            <MenuIcon />
          </Button>
        </header>

        {mobileOpen ? (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button
              type="button"
              className="absolute inset-0 bg-ink/50"
              aria-label="Close menu"
              onClick={() => setMobileOpen(false)}
            />
            <aside className="absolute inset-y-0 left-0 flex w-72 flex-col bg-navy text-white shadow-elevated">
              <div className="flex h-14 items-center justify-between px-4">
                <SiteLogo variant="horizontal" tone="onDark" href={routes.dashboard} />
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 w-9 px-0 text-white hover:bg-white/10"
                  aria-label="Close menu"
                  onClick={() => setMobileOpen(false)}
                >
                  <CloseIcon />
                </Button>
              </div>
              <nav className="flex flex-1 flex-col gap-0.5 px-3 py-2">
                {NAV_ITEMS.map((item) => {
                  const active = isActive(
                    pathname,
                    item.href,
                    "exact" in item ? item.exact : false,
                  );
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        "rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                        active
                          ? "bg-accent text-accent-foreground"
                          : "text-white/75 hover:bg-white/10",
                      )}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
              <div className="border-t border-white/10 p-4">
                <PlatformUserMenu />
              </div>
            </aside>
          </div>
        ) : null}

        <main id="main-content" className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}

function MenuIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}
