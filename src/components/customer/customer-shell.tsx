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
 * Post-booking / account chrome: dark header + iOS bottom tabs.
 * Not used during /book/* question funnel.
 */
export function CustomerShell({ children, contentClassName }: CustomerShellProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div
      data-theme="ml-dark"
      className="min-h-dvh bg-[var(--ml-dark-bg)] text-[var(--ml-dark-ink)]"
      style={{ fontFamily: "var(--ml-font-ios)" }}
    >
      <header className="sticky top-0 z-40 border-b border-[var(--ml-dark-border)] bg-[var(--ml-dark-bg)]/95 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-[1100px] items-center justify-between px-4 sm:px-6">
          <SiteLogo variant="horizontal" tone="brand" href={routes.dashboard} priority />
          <div className="flex items-center gap-1">
            <Link
              href={routes.dashboardNotifications}
              className="inline-flex size-10 items-center justify-center rounded-xl text-[var(--ml-dark-ink)] transition-colors hover:bg-[var(--ml-dark-surface)]"
              aria-label="Notifications"
            >
              <BellIcon />
            </Link>
            <Button
              variant="ghost"
              size="sm"
              className="h-10 w-10 px-0 text-[var(--ml-dark-ink)] hover:bg-[var(--ml-dark-surface)] lg:hidden"
              aria-label="Open menu"
              onClick={() => setMenuOpen(true)}
            >
              <MenuIcon />
            </Button>
            <div className="hidden lg:block">
              <PlatformUserMenu tone="dark" />
            </div>
          </div>
        </div>
      </header>

      {menuOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/60"
            aria-label="Close menu"
            onClick={() => setMenuOpen(false)}
          />
          <aside className="absolute inset-y-0 right-0 flex w-72 flex-col border-l border-[var(--ml-dark-border)] bg-[var(--ml-dark-bg)] shadow-[var(--shadow-elevated)]">
            <div className="flex h-14 items-center justify-between border-b border-[var(--ml-dark-border)] px-4">
              <span className="font-semibold text-[var(--ml-dark-ink)]">Menu</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-10 w-10 px-0 text-[var(--ml-dark-ink)] hover:bg-[var(--ml-dark-surface)]"
                aria-label="Close menu"
                onClick={() => setMenuOpen(false)}
              >
                <CloseIcon />
              </Button>
            </div>
            <nav className="flex flex-1 flex-col gap-1 p-3">
              {[
                { href: routes.home, label: "Home" },
                { href: routes.dashboardBookings, label: "Bookings" },
                { href: routes.dashboardSupport, label: "Support" },
                { href: routes.dashboardProfile, label: "Account" },
                { href: routes.bookWelcome, label: "Request a clean" },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className="rounded-xl px-3 py-2.5 text-sm font-medium text-[var(--ml-dark-ink)] hover:bg-[var(--ml-dark-surface)]"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="border-t border-[var(--ml-dark-border)] p-4">
              <PlatformUserMenu tone="dark" />
            </div>
          </aside>
        </div>
      ) : null}

      <main
        id="main-content"
        className={cn(
          "mx-auto w-full max-w-[1100px] px-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] pt-5 sm:px-6 lg:pb-10 lg:pt-8",
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
