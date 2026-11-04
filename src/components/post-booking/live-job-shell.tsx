"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { CustomerBottomNav } from "@/components/customer/customer-bottom-nav";
import { routes } from "@/config/site";

/**
 * Light post-booking chrome — matches 4-panel booking (white / navy / turquoise).
 * Bottom tabs stay so customers can jump Home / Bookings / Account.
 */
export function LiveJobShell({ children }: { children: React.ReactNode }) {
  return (
    <div
      data-theme="ml-book"
      className="flex min-h-dvh flex-col bg-white text-[var(--ml-book-ink,#01193D)]"
      style={{ fontFamily: "var(--ml-font-ios)" }}
    >
      <header className="sticky top-0 z-40 border-b border-[var(--ml-book-border,#e2e8f0)] bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-12 w-full max-w-[680px] items-center justify-between gap-3 px-4 pt-[env(safe-area-inset-top)] sm:h-14">
          <div className="flex min-w-0 items-center gap-1.5">
            <Link
              href={routes.home}
              className="inline-flex size-10 items-center justify-center rounded-xl text-[var(--ml-book-ink,#01193D)] transition-colors hover:bg-black/5"
              aria-label="Back to home"
            >
              <ChevronLeft className="size-5" strokeWidth={2.25} aria-hidden />
            </Link>
            <Link
              href={routes.home}
              className="inline-flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white ring-1 ring-[var(--ml-book-border,#e2e8f0)]"
              aria-label="MaidLinx home"
            >
              <Image
                src="/brand/maidlinx-mark.png"
                alt="MaidLinx"
                width={36}
                height={36}
                className="size-9 object-cover"
                priority
              />
            </Link>
          </div>
          <Link
            href={routes.dashboardBookings}
            className="rounded-xl px-3 py-2 text-sm font-semibold text-[var(--ml-book-primary,#04CED2)] transition-colors hover:bg-[var(--ml-book-selected,#E6FAFA)]"
          >
            My Bookings
          </Link>
        </div>
      </header>
      <main className="mx-auto w-full max-w-[680px] flex-1 px-4 py-5 pb-[calc(5.5rem+env(safe-area-inset-bottom))]">
        {children}
      </main>
      <CustomerBottomNav />
    </div>
  );
}
