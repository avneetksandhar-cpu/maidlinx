"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Briefcase, CircleUserRound, Wallet } from "lucide-react";
import { SiteLogo } from "@/components/brand/site-logo";
import { PlatformUserMenu } from "@/components/layout/platform-user-menu";
import { routes } from "@/config/site";
import { cn } from "@/lib/utils";

/** Cleaner portal tabs — Uber driver-like: Jobs · Earnings · Account */
const NAV_ITEMS = [
  {
    href: `${routes.cleanerJobs}?tab=today`,
    match: "/cleaner/jobs",
    alsoExact: ["/cleaner", "/pro"],
    label: "Jobs",
    icon: Briefcase,
  },
  {
    href: routes.cleanerEarnings,
    match: "/cleaner/earnings",
    label: "Earnings",
    icon: Wallet,
  },
  {
    href: routes.cleanerProfile,
    match: "/cleaner/profile",
    alsoMatch: ["/cleaner/settings", "/pro/settings", "/pro/profile"],
    label: "Account",
    icon: CircleUserRound,
  },
] as const;

function isActive(pathname: string, item: (typeof NAV_ITEMS)[number]): boolean {
  const proMatch = item.match.replace(/^\/cleaner/, "/pro");
  if (pathname.startsWith(item.match) || pathname.startsWith(proMatch)) return true;
  if ("alsoExact" in item && item.alsoExact) {
    const normalized = pathname.replace(/\/$/, "") || "/";
    if (item.alsoExact.includes(normalized)) return true;
  }
  if ("alsoMatch" in item && item.alsoMatch) {
    return item.alsoMatch.some((prefix) => pathname.startsWith(prefix));
  }
  return false;
}

export function ProNav() {
  const pathname = usePathname() ?? "";

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-[var(--ml-dark-border)] bg-[var(--ml-dark-bg)]/95 backdrop-blur lg:hidden">
        <div className="flex h-14 items-center justify-between px-4">
          <SiteLogo variant="mark" tone="brand" href={routes.cleanerDashboard} />
          <PlatformUserMenu tone="dark" showLabel={false} />
        </div>
      </header>

      <aside className="hidden w-56 shrink-0 flex-col border-r border-[var(--ml-dark-border)] bg-[var(--ml-dark-bg-elevated)] lg:flex">
        <div className="flex h-16 flex-col justify-center border-b border-[var(--ml-dark-border)] px-5">
          <SiteLogo variant="horizontal" tone="brand" href={routes.cleanerDashboard} />
          <p className="mt-1 text-xs text-[var(--ml-dark-ink-muted)]">Cleaner portal</p>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {NAV_ITEMS.map((item) => {
            const active = isActive(pathname, item);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-[var(--ml-dark-mint)] text-[var(--color-accent-foreground)] shadow-[0_0_20px_rgb(8_224_212_/_0.25)]"
                    : "text-[var(--ml-dark-ink-muted)] hover:bg-[var(--ml-dark-surface)] hover:text-[var(--ml-dark-ink)]",
                )}
              >
                <Icon className="h-5 w-5 shrink-0" strokeWidth={2} aria-hidden />
                {item.label}
              </Link>
            );
          })}
          <Link
            href={routes.cleanerApplication}
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[var(--ml-dark-ink-subtle)] hover:bg-[var(--ml-dark-surface)] hover:text-[var(--ml-dark-ink)]"
          >
            Application
          </Link>
          <Link
            href={routes.cleanerOnboarding}
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[var(--ml-dark-ink-subtle)] hover:bg-[var(--ml-dark-surface)] hover:text-[var(--ml-dark-ink)]"
          >
            Onboarding
          </Link>
          <Link
            href={routes.cleanerDocuments}
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[var(--ml-dark-ink-subtle)] hover:bg-[var(--ml-dark-surface)] hover:text-[var(--ml-dark-ink)]"
          >
            Documents
          </Link>
        </nav>
        <div className="mt-auto space-y-2 border-t border-[var(--ml-dark-border)] p-4">
          <PlatformUserMenu tone="dark" className="w-full justify-start" />
        </div>
      </aside>

      <nav
        aria-label="Cleaner"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--ml-dark-border)] bg-[var(--ml-dark-bg)]/95 backdrop-blur-md lg:hidden"
        style={{ fontFamily: "var(--ml-font-ios)" }}
      >
        <div className="mx-auto grid h-[3.75rem] max-w-lg grid-cols-3 px-1 pb-[max(0.35rem,env(safe-area-inset-bottom))] pt-1">
          {NAV_ITEMS.map((item) => {
            const active = isActive(pathname, item);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-xl px-1 text-[10px] font-medium tracking-wide transition-colors",
                  active
                    ? "text-[var(--ml-dark-mint)]"
                    : "text-[var(--ml-dark-ink-muted)] active:text-[var(--ml-dark-ink)]",
                )}
              >
                <Icon className="size-6" strokeWidth={active ? 2.35 : 1.85} aria-hidden />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
