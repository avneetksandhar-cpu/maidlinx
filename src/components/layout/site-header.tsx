"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronDown, Menu, X } from "lucide-react";
import { SiteLogo } from "@/components/brand/site-logo";
import { routes, siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Services", href: `${routes.home}#services`, hasChevron: true },
  { label: "Business", href: routes.forBusiness },
  { label: "Become a Pro", href: routes.becomeCleaner },
  { label: "How it works", href: `${routes.home}#how-it-works` },
  { label: "Help", href: siteConfig.links.help },
] as const;

interface SiteHeaderProps {
  className?: string;
  authControls: React.ReactNode;
  variant?: "default" | "minimal";
}

export function SiteHeader({ className, authControls, variant = "default" }: SiteHeaderProps) {
  const minimal = variant === "minimal";
  const [open, setOpen] = useState(false);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b border-[var(--maidlinx-border)] bg-white",
        className,
      )}
    >
      <div className="mx-auto flex h-16 max-w-[1320px] items-center justify-between gap-4 px-5 sm:h-20 sm:px-8 lg:px-12">
        <SiteLogo
          variant="horizontal"
          priority
          className="max-w-[8.5rem] sm:max-w-none"
        />

        {!minimal ? (
          <nav className="hidden items-center gap-7 xl:gap-8 lg:flex" aria-label="Primary">
            {navItems.map((item) => (
              <Link
                key={item.href + item.label}
                href={item.href}
                className="inline-flex items-center gap-1 text-sm font-medium text-[var(--maidlinx-text)] transition-colors duration-200 hover:text-[var(--maidlinx-green)]"
              >
                {item.label}
                {"hasChevron" in item && item.hasChevron ? (
                  <ChevronDown className="size-3.5 opacity-60" aria-hidden />
                ) : null}
              </Link>
            ))}
          </nav>
        ) : (
          <span className="hidden lg:block" aria-hidden />
        )}

        <div className="flex items-center gap-2">
          {!minimal ? (
            <div className="hidden items-center gap-2 sm:flex">{authControls}</div>
          ) : (
            authControls
          )}
          {!minimal ? (
            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-[var(--maidlinx-ink)] transition-colors duration-200 hover:bg-[var(--maidlinx-mint-soft)] lg:hidden"
              aria-expanded={open}
              aria-controls="mobile-nav"
              aria-label={open ? "Close menu" : "Open menu"}
              onClick={() => setOpen((value) => !value)}
            >
              {open ? <X className="h-5 w-5" aria-hidden /> : <Menu className="h-5 w-5" aria-hidden />}
            </button>
          ) : null}
        </div>
      </div>

      {!minimal && open ? (
        <div id="mobile-nav" className="border-t border-[var(--maidlinx-border)] bg-white lg:hidden">
          <nav className="mx-auto flex max-w-[1320px] flex-col gap-0.5 px-5 py-3 sm:px-8" aria-label="Mobile">
            {navItems.map((item) => (
              <Link
                key={item.href + item.label}
                href={item.href}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-[var(--maidlinx-ink)] transition-colors duration-200 hover:bg-[var(--maidlinx-mint-soft)]"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <div
              className="mt-2 flex flex-col gap-2 border-t border-[var(--maidlinx-border)] px-3 pt-3 sm:hidden"
              onClick={() => setOpen(false)}
            >
              {authControls}
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
