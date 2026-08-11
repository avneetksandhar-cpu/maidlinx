"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { SiteLogo } from "@/components/brand/site-logo";
import { routes } from "@/config/site";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Services", href: `${routes.home}#services` },
  { label: "Business", href: routes.forBusiness },
  { label: "Become a Pro", href: routes.becomeCleaner },
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
        "sticky top-0 z-50 border-b border-border bg-surface",
        className,
      )}
    >
      <div className="container-app flex h-14 items-center justify-between gap-4">
        <SiteLogo
          variant="horizontal"
          priority
          className="max-w-[8.5rem] sm:max-w-none"
        />

        {!minimal ? (
          <nav className="hidden items-center gap-7 lg:flex" aria-label="Primary">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-medium text-ink-muted transition-colors duration-200 hover:text-ink"
              >
                {item.label}
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
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-ink transition-colors duration-200 hover:bg-surface-muted lg:hidden"
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
        <div id="mobile-nav" className="border-t border-border bg-surface lg:hidden">
          <nav className="container-app flex flex-col gap-0.5 py-3" aria-label="Mobile">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-ink transition-colors duration-200 hover:bg-surface-muted"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <div
              className="mt-2 flex flex-col gap-2 border-t border-border px-3 pt-3 sm:hidden"
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
