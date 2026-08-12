import Link from "next/link";
import { routes } from "@/config/site";

const LINKS = [
  { href: routes.owner, label: "Command center" },
  { href: routes.admin, label: "Ops admin" },
  { href: routes.adminRevenue, label: "Revenue" },
  { href: routes.adminAnalytics, label: "Analytics" },
  { href: routes.adminAudit, label: "Admin audit" },
] as const;

export function OwnerNav() {
  return (
    <aside className="w-full shrink-0 border-b border-border bg-ink px-4 py-4 text-white sm:w-56 sm:border-b-0 sm:border-r lg:w-64">
      <p className="font-display text-lg font-semibold tracking-tight">MaidLinx Owner</p>
      <p className="mt-1 text-xs text-white/60">AI executive command center</p>
      <nav className="mt-6 flex flex-row gap-3 overflow-x-auto sm:flex-col sm:gap-1">
        {LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="whitespace-nowrap rounded-md px-2 py-1.5 text-sm text-white/85 hover:bg-white/10 hover:text-white"
          >
            {link.label}
          </Link>
        ))}
      </nav>
      <p className="mt-8 hidden text-[11px] leading-relaxed text-white/45 sm:block">
        Stripe LIVE disabled. Estimates labeled. GREEN analytics only auto-runs.
      </p>
    </aside>
  );
}
