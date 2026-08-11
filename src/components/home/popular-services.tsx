"use client";

import { useRouter } from "next/navigation";
import { Building2, HardHat, Home, Truck } from "lucide-react";
import { routes } from "@/config/site";

const SERVICES = [
  { label: "Residential", href: routes.bookAddress, icon: Home },
  { label: "Commercial", href: routes.bookAddress, icon: Building2 },
  { label: "Move-in/out", href: `${routes.book}?service=move_in`, icon: Truck },
  {
    label: "Post-construction",
    href: `${routes.book}?service=post_construction`,
    icon: HardHat,
  },
] as const;

export function PopularServices() {
  const router = useRouter();

  return (
    <div>
      <p className="text-sm font-medium text-[var(--maidlinx-muted)]">Popular services</p>
      <ul className="mt-3 flex flex-wrap gap-2.5" aria-label="Popular services">
        {SERVICES.map(({ label, href, icon: Icon }) => (
          <li key={label}>
            <button
              type="button"
              onClick={() => router.push(href)}
              className="inline-flex items-center gap-2 rounded-[10px] border border-[var(--maidlinx-border)] bg-white px-3.5 py-2.5 text-sm font-medium text-[var(--maidlinx-text)] transition-colors hover:border-[var(--maidlinx-green)]/35 hover:text-[var(--maidlinx-green)]"
            >
              <Icon className="size-4 text-[var(--maidlinx-green)]" strokeWidth={1.75} aria-hidden />
              {label}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
