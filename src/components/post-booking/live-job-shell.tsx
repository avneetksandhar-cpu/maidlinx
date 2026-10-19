"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { SiteLogo } from "@/components/brand/site-logo";
import { routes } from "@/config/site";

/**
 * Dark iOS chrome for live job status (Uber arriving loop).
 * Keeps marketing/account chrome off the critical post-pay path.
 */
export function LiveJobShell({ children }: { children: React.ReactNode }) {
  return (
    <div
      data-theme="ml-dark"
      className="flex min-h-dvh flex-col bg-[var(--ml-dark-bg)] text-[var(--ml-dark-ink)]"
      style={{ fontFamily: "var(--ml-font-ios)" }}
    >
      <header className="sticky top-0 z-40 border-b border-[var(--ml-dark-border)]/80 bg-[var(--ml-dark-bg)]/95 backdrop-blur-md">
        <div className="mx-auto flex h-12 w-full max-w-[680px] items-center justify-between gap-3 px-4 pt-[env(safe-area-inset-top)] sm:h-14">
          <div className="flex min-w-0 items-center gap-1.5">
            <Link
              href={routes.home}
              className="inline-flex size-10 items-center justify-center rounded-xl text-[var(--ml-dark-ink)] transition-colors hover:bg-[var(--ml-dark-surface)]"
              aria-label="Back to home"
            >
              <ChevronLeft className="size-5" strokeWidth={2.25} aria-hidden />
            </Link>
            <SiteLogo variant="mark" tone="brand" href={routes.home} className="shrink-0" />
          </div>
          <Link
            href={routes.dashboardBookings}
            className="rounded-xl px-3 py-2 text-sm font-medium text-[var(--ml-dark-ink-muted)] transition-colors hover:bg-[var(--ml-dark-surface)] hover:text-[var(--ml-dark-ink)]"
          >
            Bookings
          </Link>
        </div>
      </header>
      <main className="mx-auto w-full max-w-[680px] flex-1 px-4 py-5 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        {children}
      </main>
    </div>
  );
}
