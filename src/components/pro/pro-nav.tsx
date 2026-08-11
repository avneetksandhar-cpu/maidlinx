"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/dashboard/theme-toggle";
import { PlatformUserMenu } from "@/components/layout/platform-user-menu";
import { routes } from "@/config/site";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: `${routes.cleanerJobs}?tab=today`, match: "/cleaner/jobs", label: "Jobs", icon: BriefcaseIcon },
  { href: routes.cleanerSettings, match: "/cleaner/settings", label: "Settings", icon: SettingsIcon },
] as const;

export function ProNav() {
  const pathname = usePathname() ?? "";

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border bg-surface/95 backdrop-blur lg:hidden">
        <div className="flex h-14 items-center justify-between px-4">
          <Link href={`${routes.cleanerJobs}?tab=today`} className="font-display text-base font-semibold text-navy">
            MaidLinx <span className="text-teal">Cleaner</span>
          </Link>
          <div className="flex items-center gap-1">
            <ThemeToggle compact />
            <PlatformUserMenu />
          </div>
        </div>
      </header>

      <aside className="hidden w-56 shrink-0 border-r border-border bg-surface lg:flex lg:flex-col">
        <div className="flex h-16 flex-col justify-center border-b border-border px-6">
          <Link href={`${routes.cleanerJobs}?tab=today`} className="font-display text-lg font-semibold text-navy">
            MaidLinx <span className="text-teal">Cleaner</span>
          </Link>
          <p className="text-xs text-ink-muted">Cleaner portal</p>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {NAV_ITEMS.map((item) => {
            const active = pathname.startsWith(item.match) || (item.match === "/cleaner/jobs" && pathname === "/cleaner");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-teal-muted text-navy"
                    : "text-ink-muted hover:bg-surface-muted hover:text-ink",
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto space-y-2 border-t border-border p-4">
          <ThemeToggle className="w-full justify-start" />
          <div className="flex items-center justify-between px-1">
            <span className="text-sm text-ink-muted">Account</span>
            <PlatformUserMenu />
          </div>
        </div>
      </aside>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 backdrop-blur lg:hidden">
        <div className="mx-auto grid max-w-lg grid-cols-2 gap-1 px-4 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
          {NAV_ITEMS.map((item) => {
            const active =
              pathname.startsWith(item.match) ||
              (item.match === "/cleaner/jobs" && pathname === "/cleaner");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-lg px-2 py-2 text-xs font-medium transition-colors",
                  active ? "text-teal" : "text-ink-muted",
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

function BriefcaseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="8" width="18" height="12" rx="2" stroke="currentColor" strokeWidth="1.75" />
      <path d="M9 8V6a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" stroke="currentColor" strokeWidth="1.75" />
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
