"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

type AppHeaderProps = {
  title?: string;
  showBack?: boolean;
  backHref?: string;
  rightAction?: ReactNode;
  className?: string;
};

export function AppHeader({
  title,
  showBack = false,
  backHref,
  rightAction,
  className,
}: AppHeaderProps) {
  const router = useRouter();

  function handleBack() {
    if (backHref) {
      router.push(backHref);
      return;
    }
    router.back();
  }

  return (
    <header
      className={cn(
        "flex items-center justify-between py-4",
        className,
      )}
    >
      <div className="flex min-w-[3rem] items-center">
        {showBack ? (
          <button
            type="button"
            onClick={handleBack}
            aria-label="Go back"
            className="flex h-10 w-10 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-surface hover:text-ink"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        ) : title ? null : (
          <Link
            href="/home"
            className="text-xs font-semibold uppercase tracking-[0.3em] text-accent"
          >
            Wingman
          </Link>
        )}
      </div>

      {title ? (
        <h1 className="flex-1 text-center text-base font-semibold tracking-tight text-ink">
          {title}
        </h1>
      ) : (
        <div className="flex-1" />
      )}

      <div className="flex min-w-[3rem] items-center justify-end">
        {rightAction ?? null}
      </div>
    </header>
  );
}
