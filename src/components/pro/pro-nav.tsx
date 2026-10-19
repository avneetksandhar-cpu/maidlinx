"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SiteLogo } from "@/components/brand/site-logo";
import { PlatformUserMenu } from "@/components/layout/platform-user-menu";
import { routes } from "@/config/site";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: routes.cleanerDashboard, match: "/cleaner", exact: true, label: "Home", icon: HomeIcon },
  { href: `${routes.cleanerJobs}?tab=today`, match: "/cleaner/jobs", label: "Jobs", icon: BriefcaseIcon },
  { href: routes.cleanerEarnings, match: "/cleaner/earnings", label: "Pay", icon: WalletIcon },
  { href: routes.cleanerSettings, match: "/cleaner/settings", label: "More", icon: SettingsIcon },
] as const;

function isActive(pathname: string, item: (typeof NAV_ITEMS)[number]): boolean {
  if ("exact" in item && item.exact) {
    return pathname === "/cleaner" || pathname === "/pro";
  }
  const proMatch = item.match.replace(/^\/cleaner/, "/pro");
  return pathname.startsWith(item.match) || pathname.startsWith(proMatch);
}

export function ProNav() {
  const pathname = usePathname() ?? "";

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-[var(--ml-dark-border)] bg-[var(--ml-dark-bg)]/95 backdrop-blur lg:hidden">
        <div className="flex h-14 items-center justify-between px-4">
          <SiteLogo variant="mark" tone="brand" href={routes.cleanerDashboard} />
          <PlatformUserMenu />
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
                <item.icon className="h-5 w-5 shrink-0" />
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
          <div className="flex items-center justify-between px-1">
            <span className="text-sm text-[var(--ml-dark-ink-muted)]">Account</span>
            <PlatformUserMenu />
          </div>
        </div>
      </aside>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--ml-dark-border)] bg-[var(--ml-dark-bg)]/95 backdrop-blur lg:hidden">
        <div className="mx-auto grid max-w-lg grid-cols-4 gap-1 px-2 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
          {NAV_ITEMS.map((item) => {
            const active = isActive(pathname, item);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-lg px-1 py-2 text-[11px] font-medium transition-colors",
                  active ? "text-[var(--ml-dark-mint)]" : "text-[var(--ml-dark-ink-muted)]",
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}

function HomeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BriefcaseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="8" width="18" height="12" rx="2" stroke="currentColor" strokeWidth="1.75" />
      <path d="M9 8V6a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" stroke="currentColor" strokeWidth="1.75" />
    </svg>
  );
}

function WalletIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="6" width="18" height="13" rx="2" stroke="currentColor" strokeWidth="1.75" />
      <path d="M3 10h18" stroke="currentColor" strokeWidth="1.75" />
      <circle cx="16" cy="14" r="1" fill="currentColor" />
    </svg>
  );
}

function SettingsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.75" />
      <path
        d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}
