"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PlatformUserMenu } from "@/components/layout/platform-user-menu";
import { routes } from "@/config/site";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: routes.owner, label: "Revenue", short: "Rev" },
  { href: `${routes.owner}#targets`, label: "Target", short: "Tgt" },
  { href: `${routes.owner}#bookings`, label: "Bookings", short: "Book" },
  { href: routes.ownerOpportunities, label: "Opportunities", short: "Opps" },
  { href: routes.ownerExceptions, label: "Exceptions", short: "Exc" },
  { href: routes.ownerSales, label: "Sales", short: "Sales" },
  { href: routes.ownerWaitlist, label: "Waitlist", short: "Wait" },
  { href: routes.ownerCleaners, label: "Cleaners", short: "Cap" },
  { href: routes.ownerActivity, label: "Activity", short: "Act" },
  { href: `${routes.owner}#controls`, label: "AI / Pause", short: "AI" },
  { href: routes.adminContentStudio, label: "Content Studio", short: "Studio" },
  { href: routes.admin, label: "Ops admin", short: "Admin" },
] as const;

export function OwnerNav({
  aiPaused,
  simulation,
}: {
  aiPaused?: boolean;
  simulation?: boolean;
}) {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 z-20 flex w-full shrink-0 flex-col border-b border-[var(--ml-dark-border)] bg-[var(--ml-dark-bg-elevated)] text-[var(--ml-dark-ink)] sm:w-56 sm:self-start sm:min-h-screen sm:border-b-0 sm:border-r lg:w-64">
      <div className="flex flex-1 flex-col px-4 py-3 sm:py-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-display text-lg font-semibold tracking-tight">
              MaidLinx <span className="text-[var(--ml-dark-mint)]">Owner</span>
            </p>
            <p className="mt-0.5 text-xs text-[var(--ml-dark-ink-muted)]">
              Command vCenter · real data
            </p>
          </div>
          <div className="flex flex-col items-end gap-1 text-[10px] font-semibold uppercase tracking-wide">
            <span
              className={
                aiPaused
                  ? "rounded bg-rose-500/90 px-1.5 py-0.5 text-white"
                  : "rounded bg-[var(--ml-dark-mint)] px-1.5 py-0.5 text-[var(--color-accent-foreground)]"
              }
            >
              AI {aiPaused ? "Paused" : "On"}
            </span>
            {simulation != null && (
              <span className="rounded bg-[var(--ml-dark-surface)] px-1.5 py-0.5 text-[var(--ml-dark-ink-muted)]">
                Sim {simulation ? "ON" : "OFF"}
              </span>
            )}
          </div>
        </div>

        <nav
          className="mt-3 flex flex-row gap-1.5 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] sm:mt-6 sm:flex-col sm:gap-1 sm:overflow-visible sm:pb-0 [&::-webkit-scrollbar]:hidden"
          aria-label="Owner navigation"
        >
          {LINKS.map((link) => {
            const path = pathname ?? "";
            const active =
              link.href === routes.owner
                ? path === routes.owner
                : path === link.href || path.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "whitespace-nowrap rounded-xl px-2.5 py-2 text-sm transition-colors sm:py-2.5",
                  active
                    ? "bg-[var(--ml-dark-mint)] text-[var(--color-accent-foreground)] shadow-[0_0_20px_rgb(8_224_212_/_0.25)]"
                    : "text-[var(--ml-dark-ink-muted)] hover:bg-[var(--ml-dark-surface)] hover:text-[var(--ml-dark-ink)]",
                )}
              >
                <span className="sm:hidden">{link.short}</span>
                <span className="hidden sm:inline">{link.label}</span>
              </Link>
            );
          })}
        </nav>

        <p className="mt-6 hidden text-[11px] leading-relaxed text-[var(--ml-dark-ink-subtle)] sm:mt-8 sm:block">
          Stripe LIVE off. Estimates labeled. No autonomous outbound. Pause never blocks bookings.
        </p>

        <div className="mt-4 border-t border-[var(--ml-dark-border)] pt-3 sm:mt-auto sm:pt-4">
          <PlatformUserMenu tone="dark" className="w-full justify-start" />
        </div>
      </div>
    </aside>
  );
}
