"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { routes } from "@/config/site";

export function MobileHomeCTA() {
  return (
    <section className="py-6 lg:hidden">
      <div className="rounded-2xl bg-surface p-6 shadow-card">
        <p className="font-display text-2xl font-semibold tracking-tight text-ink">
          A cleaner is closer than you think.
        </p>
        <p className="mt-2 text-sm leading-relaxed text-ink-muted">
          Enter your address to see services and pricing for your market.
        </p>
        <Link
          href={routes.book}
          className={cn(
            "mt-6 inline-flex h-14 w-full items-center justify-center rounded-xl bg-accent px-6 text-base font-semibold text-white transition-colors duration-150 hover:bg-accent-hover",
          )}
        >
          Where do you need cleaning?
        </Link>
      </div>
    </section>
  );
}
