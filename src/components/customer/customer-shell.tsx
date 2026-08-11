"use client";

import Link from "next/link";
import { useState } from "react";
import { SiteLogo } from "@/components/brand/site-logo";
import { CustomerBottomNav } from "@/components/customer/customer-bottom-nav";
import { PlatformUserMenu } from "@/components/layout/platform-user-menu";
import { Button } from "@/components/ui";
import { routes } from "@/config/site";
import { cn } from "@/lib/utils";

interface CustomerShellProps {
  children: React.ReactNode;
  /** Max content width — mobile phone frame on large screens. */
  contentClassName?: string;
}

/**
 * Post-booking / account chrome: logo header + mobile bottom nav.
 * Not used during /book/* question funnel.
 */
export function CustomerShell({ children, contentClassName }: CustomerShellProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-dvh bg-[var(--maidlinx-bg)] text-[var(--maidlinx-ink)]">
      <header className="sticky top-0 z-40 border-b border-[var(--maidlinx-border)] bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-[1100px] items-center justify-between px-4 sm:px-6">
          <SiteLogo variant="horizontal" href={routes.dashboard} priority />
          <div className="flex items-center gap-1">
            <Link
              href={routes.dashboardNotifications}
              className="inline-flex size-9 items-center justify-center rounded-lg text-[var(--maidlinx-ink)] transition-colors hover:bg-[var(--maidlinx-mint)]"
              aria-label="Notifications"
            >
              <BellIcon />
            </Link>
            <Button
              variant="ghost"
              size="sm"
              className="h-9 w-9 px-0 lg:hidden"
              aria-label="Open menu"
              onClick={() => setMenuOpen(true)}
            >
              <MenuIcon />
            </Button>
            <div className="hidden lg:block">
              <PlatformUserMenu />
            </div>
          </div>
        </div>
      </header>

      {menuOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-ink/40"
            aria-label="Close menu"
            onClick={() => setMenuOpen(false)}
          />
          <aside className="absolute inset-y-0 right-0 flex w-72 flex-col bg-white shadow-elevated">
            <div className="flex h-14 items-center justify-between border-b border-[var(--maidlinx-border)] px-4">
              <span className="font-display font-semibold">Menu</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-9 w-9 px-0"
                aria-label="Close menu"
                onClick={() => setMenuOpen(false)}
              >
                <CloseIcon />
              </Button>
            </div>
            <nav className="flex flex-1 flex-col gap-1 p-3">
              {[
                { href: routes.dashboard, label: "Home" },
                { href: routes.dashboardBookings, label: "Bookings" },
                { href: routes.dashboardInvoices, label: "Payment" },
                { href: routes.dashboardProfile, label: "Account" },
                { href: routes.book, label: "Book a clean" },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-sm font-medium text-[var(--maidlinx-text)] hover:bg-[var(--maidlinx-mint)]"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="border-t border-[var(--maidlinx-border)] p-4">
              <PlatformUserMenu />
            </div>
          </aside>
        </div>
      ) : null}

      <main
        id="main-content"
        className={cn(
          "mx-auto w-full max-w-[1100px] px-4 pb-28 pt-5 sm:px-6 lg:pb-10 lg:pt-8",
          contentClassName,
        )}
      >
        <div className="mx-auto w-full max-w-[430px] lg:max-w-[1100px]">{children}</div>
      </main>

      <CustomerBottomNav />
    </div>
  );
}

function BellIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 4a5 5 0 0 0-5 5v3l-1.5 3H18.5L17 12V9a5 5 0 0 0-5-5Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
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
