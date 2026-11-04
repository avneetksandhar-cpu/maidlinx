"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import {
  BrandLockup,
  type BrandLockupSize,
  type BrandLockupTone,
} from "@/components/brand/brand-lockup";
import { cn } from "@/lib/utils";

export interface BrandHeaderProps {
  /** Logo destination */
  homeHref: string;
  onBack?: () => void;
  backHref?: string;
  trailing?: React.ReactNode;
  leading?: React.ReactNode;
  className?: string;
  /** Full lockup on tab roots; compact during booking funnel. */
  size?: BrandLockupSize;
  tone?: BrandLockupTone;
  /** Midnight navy bar (default) vs transparent over existing navy page. */
  surface?: "navy" | "transparent";
  /** Center lockup (default) vs start-aligned. */
  align?: "center" | "start";
  /** Mark only — rare; prefer compact size with wordmark. */
  markOnly?: boolean;
  /** Optional center slot (e.g. booking progress) when align=start. */
  centerSlot?: React.ReactNode;
}

/**
 * Shared MaidLinx customer header — circular logo + MaidLinx wordmark.
 * Midnight navy · Maid white · Linx #04CED2 · system font.
 */
export function BrandHeader({
  homeHref,
  onBack,
  backHref,
  trailing,
  leading,
  className,
  size = "default",
  tone = "onDark",
  surface = "navy",
  align = "center",
  markOnly = false,
  centerSlot,
}: BrandHeaderProps) {
  const showBack = Boolean(onBack || backHref);
  const barBg =
    surface === "transparent"
      ? "bg-transparent"
      : "bg-[var(--ml-dark-bg,#01193D)] text-white";

  const backControl = showBack ? (
    onBack ? (
      <button
        type="button"
        onClick={onBack}
        className="inline-flex size-11 items-center justify-center rounded-xl text-white transition-colors hover:bg-white/10"
        aria-label="Go back"
      >
        <ChevronLeft className="size-6" strokeWidth={2.25} aria-hidden />
      </button>
    ) : (
      <Link
        href={backHref!}
        className="inline-flex size-11 items-center justify-center rounded-xl text-white transition-colors hover:bg-white/10"
        aria-label="Go back"
      >
        <ChevronLeft className="size-6" strokeWidth={2.25} aria-hidden />
      </Link>
    )
  ) : null;

  const lockup = (
    <BrandLockup
      href={homeHref}
      size={size}
      tone={tone}
      markOnly={markOnly}
      priority
    />
  );

  if (align === "start") {
    return (
      <header
        className={cn("sticky top-0 z-40 shrink-0", barBg, className)}
        style={{ fontFamily: "var(--ml-font-ios)" }}
      >
        <div className="relative mx-auto flex h-14 max-w-[680px] items-center gap-1 px-3 pt-[env(safe-area-inset-top)] sm:px-4">
          <div className="z-10 flex min-w-0 items-center gap-0.5">
            {leading}
            {backControl}
            {lockup}
          </div>
          {centerSlot ? (
            <div className="pointer-events-none absolute inset-x-24 flex justify-center sm:inset-x-28">
              {centerSlot}
            </div>
          ) : null}
          <div className="z-10 ml-auto flex min-w-[2.75rem] items-center justify-end">
            {trailing}
          </div>
        </div>
      </header>
    );
  }

  return (
    <header
      className={cn("sticky top-0 z-40 shrink-0", barBg, className)}
      style={{ fontFamily: "var(--ml-font-ios)" }}
    >
      <div className="relative mx-auto flex h-14 max-w-[680px] items-center justify-between px-3 pt-[env(safe-area-inset-top)] sm:px-4">
        <div className="z-10 flex min-w-[2.75rem] items-center justify-start">
          {leading}
          {backControl}
        </div>

        <div className="pointer-events-none absolute inset-x-0 flex justify-center px-16">
          <div className="pointer-events-auto">{lockup}</div>
        </div>

        <div className="z-10 flex min-w-[2.75rem] items-center justify-end">
          {trailing}
        </div>
      </div>
    </header>
  );
}
