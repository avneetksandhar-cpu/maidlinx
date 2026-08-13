"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { routes } from "@/config/site";

const LINKS = [
  { href: routes.owner, label: "Revenue", short: "Rev" },
  { href: `${routes.owner}#targets`, label: "Target", short: "Tgt" },
  { href: `${routes.owner}#bookings`, label: "Bookings", short: "Book" },
  { href: routes.ownerOpportunities, label: "Opportunities", short: "Opps" },
  { href: routes.ownerExceptions, label: "Exceptions", short: "Exc" },
  { href: routes.ownerSales, label: "Sales", short: "Sales" },
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
    <aside className="sticky top-0 z-20 w-full shrink-0 border-b border-border bg-ink text-white sm:w-56 sm:border-b-0 sm:border-r lg:w-64 sm:self-start sm:min-h-screen">
      <div className="px-4 py-3 sm:py-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-display text-lg font-semibold tracking-tight">MaidLinx Owner</p>
            <p className="mt-0.5 text-xs text-white/60">Command vCenter · real data</p>
          </div>
          <div className="flex flex-col items-end gap-1 text-[10px] font-semibold uppercase tracking-wide">
            <span
              className={
                aiPaused ? "rounded bg-rose-500/90 px-1.5 py-0.5" : "rounded bg-emerald-600/90 px-1.5 py-0.5"
              }
            >
              AI {aiPaused ? "Paused" : "On"}
            </span>
            {simulation != null && (
              <span className="rounded bg-white/15 px-1.5 py-0.5 text-white/80">
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
                className={`whitespace-nowrap rounded-md px-2.5 py-2 text-sm sm:py-1.5 ${
                  active
                    ? "bg-white/15 text-white"
                    : "text-white/80 hover:bg-white/10 hover:text-white"
                }`}
              >
                <span className="sm:hidden">{link.short}</span>
                <span className="hidden sm:inline">{link.label}</span>
              </Link>
            );
          })}
        </nav>

        <p className="mt-6 hidden text-[11px] leading-relaxed text-white/45 sm:mt-8 sm:block">
          Stripe LIVE off. Estimates labeled. No autonomous outbound. Pause never blocks bookings.
        </p>
      </div>
    </aside>
  );
}
