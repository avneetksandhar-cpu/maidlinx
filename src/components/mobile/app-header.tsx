"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { SiteLogo } from "@/components/brand/site-logo";
import { cn } from "@/lib/utils";

interface AppHeaderProps {
  /** Logo destination */
  homeHref: string;
  /** Optional back control */
  onBack?: () => void;
  backHref?: string;
  /** Right-side actions (profile, menu, help) */
  trailing?: React.ReactNode;
  /** Show hamburger / menu affordance slot on the left instead of back */
  leading?: React.ReactNode;
  className?: string;
  /** Compact mark vs horizontal lockup */
  logoVariant?: "mark" | "horizontal";
  /** Center logo in the bar (cleaner/ops design reference). Default true. */
  centerLogo?: boolean;
}

/**
 * Premium MaidLinx mobile chrome — solid mint-teal bar (design reference).
 * Navy logo on teal for contrast; safe-area aware.
 */
export function AppHeader({
  homeHref,
  onBack,
  backHref,
  trailing,
  leading,
  className,
  logoVariant = "mark",
  centerLogo = true,
}: AppHeaderProps) {
  const showBack = Boolean(onBack || backHref);

  if (centerLogo) {
    return (
      <header
        className={cn(
          "sticky top-0 z-40 shrink-0 bg-[var(--ml-app-header)] text-[var(--ml-app-header-ink)]",
          className,
        )}
        style={{ fontFamily: "var(--ml-font-ios)" }}
      >
        <div className="relative mx-auto flex h-14 max-w-[680px] items-center justify-between px-3 pt-[env(safe-area-inset-top)] sm:px-4">
          <div className="z-10 flex min-w-[2.75rem] items-center justify-start">
            {leading}
            {showBack ? (
              onBack ? (
                <button
                  type="button"
                  onClick={onBack}
                  className="inline-flex size-11 items-center justify-center rounded-xl text-[var(--ml-app-header-ink)] transition-colors hover:bg-black/10"
                  aria-label="Go back"
                >
                  <ChevronLeft className="size-6" strokeWidth={2.25} aria-hidden />
                </button>
              ) : (
                <Link
                  href={backHref!}
                  className="inline-flex size-11 items-center justify-center rounded-xl text-[var(--ml-app-header-ink)] transition-colors hover:bg-black/10"
                  aria-label="Go back"
                >
                  <ChevronLeft className="size-6" strokeWidth={2.25} aria-hidden />
                </Link>
              )
            ) : null}
          </div>

          <div className="pointer-events-none absolute inset-x-0 flex justify-center">
            <SiteLogo
              variant={logoVariant}
              tone="onLight"
              href={homeHref}
              className="pointer-events-auto shrink-0 [&_img]:brightness-100"
              priority
            />
          </div>

          <div className="z-10 flex min-w-[2.75rem] items-center justify-end">
            {trailing}
          </div>
        </div>
      </header>
    );
  }

  return (
    <header
      className={cn(
        "sticky top-0 z-40 shrink-0 bg-[var(--ml-app-header)] text-[var(--ml-app-header-ink)]",
        className,
      )}
      style={{ fontFamily: "var(--ml-font-ios)" }}
    >
      <div className="mx-auto flex h-14 max-w-[680px] items-center justify-between gap-2 px-3 pt-[env(safe-area-inset-top)] sm:px-4">
        <div className="flex min-w-0 items-center gap-1">
          {leading}
          {showBack ? (
            onBack ? (
              <button
                type="button"
                onClick={onBack}
                className="inline-flex size-11 items-center justify-center rounded-xl text-[var(--ml-app-header-ink)] transition-colors hover:bg-black/10"
                aria-label="Go back"
              >
                <ChevronLeft className="size-6" strokeWidth={2.25} aria-hidden />
              </button>
            ) : (
              <Link
                href={backHref!}
                className="inline-flex size-11 items-center justify-center rounded-xl text-[var(--ml-app-header-ink)] transition-colors hover:bg-black/10"
                aria-label="Go back"
              >
                <ChevronLeft className="size-6" strokeWidth={2.25} aria-hidden />
              </Link>
            )
          ) : null}
          <SiteLogo
            variant={logoVariant}
            tone="onLight"
            href={homeHref}
            className="shrink-0 [&_img]:brightness-100"
            priority
          />
        </div>
        {trailing ? <div className="flex items-center gap-0.5">{trailing}</div> : null}
      </div>
    </header>
  );
}
