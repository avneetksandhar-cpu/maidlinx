"use client";

import { ShieldCheck, Sparkles, Users } from "lucide-react";
import { HeroSearch } from "@/components/home/hero-search";
import { PopularServices } from "@/components/home/popular-services";
import { TrustCard } from "@/components/home/trust-card";
import { MapPreview } from "@/components/home/map-preview";
import { BookingPreview } from "@/components/home/booking-preview";
import { TrustBar } from "@/components/home/trust-bar";
import type { BookingState } from "@/lib/bookings/booking-state";
import type { WaitlistReason } from "@/lib/markets/booking-availability";

interface HomeHeroProps {
  state: BookingState;
  onAddressChange: (value: Partial<BookingState>) => void;
  onAddressSelected: (value: Partial<BookingState>) => void;
  onFindCleaners: () => void;
  waitlistReason?: WaitlistReason | null;
}

export function HomeHero({
  state,
  onAddressChange,
  onAddressSelected,
  onFindCleaners,
  waitlistReason = null,
}: HomeHeroProps) {
  return (
    <section className="relative overflow-hidden bg-[var(--maidlinx-bg)]">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 55% 40% at 88% 12%, rgba(8,127,101,0.09), transparent 58%), radial-gradient(ellipse 45% 35% at 8% 78%, rgba(8,127,101,0.05), transparent 55%)",
        }}
        aria-hidden
      />

      <div className="relative mx-auto w-full max-w-[1320px] px-5 pt-16 pb-10 sm:px-8 sm:pt-20 sm:pb-12 lg:px-12 lg:pt-24 lg:pb-14">
        <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,0.48fr)_minmax(0,0.52fr)] lg:gap-12 xl:gap-14">
          {/* Left */}
          <div className="animate-[fadeIn_0.35s_ease]">
            <div className="inline-flex items-center gap-2 rounded-full bg-[var(--maidlinx-mint)] px-3.5 py-1.5 text-sm font-medium text-[var(--maidlinx-green)]">
              <Users className="size-4" strokeWidth={1.75} aria-hidden />
              Trusted cleaning professionals
            </div>

            <h1 className="relative mt-5 max-w-[16ch] text-[2.875rem] leading-[0.98] font-bold tracking-tight text-[var(--maidlinx-ink)] sm:text-[3.5rem] lg:text-[4.75rem]">
              Cleaning,
              <br />
              <span className="text-[var(--maidlinx-green)]">on demand.</span>
              <span className="absolute top-2 right-0 hidden text-[var(--maidlinx-green)]/50 sm:inline-flex lg:right-[-1.5rem]" aria-hidden>
                <Sparkles className="size-5 lg:size-6" strokeWidth={1.5} />
              </span>
              <span className="absolute top-10 right-6 hidden text-[var(--maidlinx-green)]/35 sm:inline-flex lg:right-0" aria-hidden>
                <Sparkles className="size-3.5" strokeWidth={1.5} />
              </span>
              <span className="absolute top-16 right-2 hidden text-[var(--maidlinx-green)]/40 lg:inline-flex" aria-hidden>
                <Sparkles className="size-4" strokeWidth={1.5} />
              </span>
            </h1>

            <p className="mt-4 max-w-[520px] text-lg leading-relaxed text-[var(--maidlinx-muted)] sm:text-[1.25rem]">
              Book trusted cleaning professionals in minutes.
            </p>

            <div className="mt-7 max-w-xl space-y-6">
              <HeroSearch
                value={state}
                onChange={onAddressChange}
                onAddressSelected={onAddressSelected}
                onFindCleaners={onFindCleaners}
                waitlistReason={waitlistReason}
              />
              <PopularServices />
              <TrustCard />
            </div>
          </div>

          {/* Right */}
          <div className="animate-[riseIn_0.5s_ease] lg:pt-2">
            <div className="rounded-[28px] border border-[var(--maidlinx-border)] bg-white p-4 shadow-[var(--shadow-card)] sm:p-6 lg:p-8">
              <div className="flex items-center gap-4 overflow-hidden rounded-[18px] bg-[var(--maidlinx-mint)] p-4 sm:p-5">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">
                  <ShieldCheck
                    className="size-5 text-[var(--maidlinx-green)]"
                    strokeWidth={1.75}
                    aria-hidden
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-base font-semibold text-[var(--maidlinx-ink)] sm:text-lg">
                    Your home, your time.
                  </p>
                  <p className="mt-1 text-sm leading-snug text-[var(--maidlinx-muted)]">
                    We handle the cleaning so you can focus on what matters.
                  </p>
                </div>
                <div
                  className="hidden h-20 w-24 shrink-0 rounded-xl bg-gradient-to-br from-white/80 to-[var(--maidlinx-mint-soft)] ring-1 ring-white/70 sm:block"
                  aria-hidden
                >
                  <div className="m-3 h-10 rounded-lg bg-[var(--maidlinx-green)]/15" />
                  <div className="mx-4 h-2 w-1/2 rounded-full bg-[var(--maidlinx-green)]/20" />
                </div>
              </div>

              <MapPreview />
              <BookingPreview />
            </div>
          </div>
        </div>

        <TrustBar />
      </div>
    </section>
  );
}
