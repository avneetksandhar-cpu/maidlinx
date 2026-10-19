"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MapPin } from "lucide-react";
import { SiteLogo } from "@/components/brand/site-logo";
import { Button } from "@/components/ui";
import { AuthControls } from "@/components/layout/auth-controls";
import { CustomerBottomNav } from "@/components/customer/customer-bottom-nav";
import { BOOKING_SCREEN_PATHS } from "@/lib/bookings/booking-routes";
import { routes } from "@/config/site";
import { trackBookingEvent } from "@/lib/analytics/booking";

/**
 * Uber-style app open — one decision: request a clean.
 * No marketing scroll; map atmosphere only (no fake cleaners/ETAs).
 */
export function AppOpenHome() {
  const router = useRouter();

  const requestClean = () => {
    trackBookingEvent("booking_started", { entry: "app_open" });
    router.push(BOOKING_SCREEN_PATHS.welcome);
  };

  return (
    <div
      data-theme="ml-dark"
      className="relative flex h-dvh flex-col overflow-hidden bg-[var(--ml-dark-bg)] text-[var(--ml-dark-ink)]"
      style={{ fontFamily: "var(--ml-font-ios)" }}
    >
      {/* Atmosphere map plane — decorative only */}
      <div className="absolute inset-0" aria-hidden>
        <Image
          src="/booking/welcome-living.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--ml-dark-bg)]/70 via-[var(--ml-dark-bg)]/55 to-[var(--ml-dark-bg)]" />
        <div className="absolute inset-0 bg-[radial-gradient(70%_45%_at_50%_20%,rgb(8_224_212_/_0.16),transparent_55%)]" />
      </div>

      <header className="relative z-10 flex items-center justify-between px-4 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <SiteLogo variant="mark" tone="brand" href={routes.home} priority />
        <div className="[&_a]:text-[var(--ml-dark-ink-muted)] [&_button]:text-[var(--ml-dark-ink-muted)]">
          <AuthControls />
        </div>
      </header>

      <main className="relative z-10 flex flex-1 flex-col px-5 pb-[calc(5.5rem+env(safe-area-inset-bottom))] pt-6">
        <div className="booking-shell-enter mx-auto w-full max-w-md flex-1 flex flex-col">
          <p className="text-center text-[11px] font-semibold tracking-[0.22em] text-[var(--ml-dark-mint)] uppercase">
            MaidLinx
          </p>
          <h1 className="mt-3 text-center text-[1.85rem] font-semibold leading-tight tracking-tight text-white sm:text-[2.1rem]">
            Request a clean
          </h1>
          <p className="mx-auto mt-2 max-w-[22rem] text-center text-[15px] leading-snug text-[var(--ml-dark-ink-muted)]">
            Pick a place, choose a service, confirm — like a ride for your space.
          </p>

          <div className="mt-auto space-y-3">
            <button
              type="button"
              onClick={() => {
                trackBookingEvent("booking_started", { entry: "app_open_where" });
                router.push(BOOKING_SCREEN_PATHS.welcome);
              }}
              className="flex w-full items-center gap-3 rounded-2xl border border-[var(--ml-dark-border)] bg-[var(--ml-dark-surface)]/90 px-4 py-3.5 text-left backdrop-blur-sm transition-colors hover:border-[var(--ml-dark-mint)]/40"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[var(--ml-dark-mint)]/15 text-[var(--ml-dark-mint)]">
                <MapPin className="size-5" strokeWidth={2.25} aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-semibold text-white">Where to?</span>
                <span className="block text-sm text-[var(--ml-dark-ink-muted)]">
                  Enter address after you start
                </span>
              </span>
            </button>

            <Button
              type="button"
              variant="accent"
              size="lg"
              className="booking-cta-btn h-14 w-full rounded-2xl text-base font-semibold shadow-[0_0_28px_rgb(8_224_212_/_0.28)]"
              onClick={requestClean}
            >
              Request a clean
              <span aria-hidden>→</span>
            </Button>

            <p className="text-center text-sm text-[var(--ml-dark-ink-muted)]">
              Pro or business?{" "}
              <Link
                href={routes.becomeCleaner}
                className="font-medium text-[var(--ml-dark-mint)] underline-offset-4 hover:underline"
              >
                Earn with MaidLinx
              </Link>
              {" · "}
              <Link
                href={routes.forBusiness}
                className="font-medium text-[var(--ml-dark-mint)] underline-offset-4 hover:underline"
              >
                For business
              </Link>
            </p>
          </div>
        </div>
      </main>

      <CustomerBottomNav />
    </div>
  );
}
