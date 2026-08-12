import Link from "next/link";
import { routes } from "@/config/site";

const LINKS = [
  { href: routes.owner, label: "Command center" },
  { href: `${routes.owner}#controls`, label: "AI controls" },
  { href: routes.admin, label: "Ops admin" },
  { href: routes.adminRevenue, label: "Revenue" },
  { href: routes.adminAnalytics, label: "Analytics" },
  { href: routes.adminAudit, label: "Admin audit" },
] as const;

export function OwnerNav() {
  return (
    <aside className="w-full shrink-0 border-b border-border bg-ink px-4 py-3 text-white sm:w-56 sm:border-b-0 sm:border-r lg:w-64 sm:py-4">
      <p className="font-display text-lg font-semibold tracking-tight">MaidLinx Owner</p>
      <p className="mt-1 text-xs text-white/60">AI OS · founder command center</p>
      <nav
        className="mt-4 flex flex-row gap-2 overflow-x-auto pb-1 sm:mt-6 sm:flex-col sm:gap-1 sm:overflow-visible sm:pb-0"
        aria-label="Owner navigation"
      >
        {LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="whitespace-nowrap rounded-md px-2 py-2 text-sm text-white/85 hover:bg-white/10 hover:text-white sm:py-1.5"
          >
            {link.label}
          </Link>
        ))}
      </nav>
      <p className="mt-6 hidden text-[11px] leading-relaxed text-white/45 sm:mt-8 sm:block">
        Stripe LIVE disabled. Simulation default ON. Global pause available. No RED autonomy.
      </p>
    </aside>
  );
}
