"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SiteLogo } from "@/components/brand/site-logo";
import { Button } from "@/components/ui";
import { useBookingGuard } from "@/components/booking/use-booking-guard";
import { BOOKING_SCREEN_PATHS } from "@/lib/bookings/booking-routes";
import { routes } from "@/config/site";
import { trackBookingEvent } from "@/lib/analytics/booking";

/**
 * Full-bleed welcome — logo, immersive property, mint Get Started.
 * Design-spec screen 1.
 */
export function WelcomeScreen() {
  const router = useRouter();
  const { hydrated, blocked } = useBookingGuard("welcome");

  const start = () => {
    trackBookingEvent("booking_started", { entry: "welcome" });
    router.push(BOOKING_SCREEN_PATHS.property);
  };

  if (!hydrated || blocked) {
    return (
      <div
        data-theme="ml-dark"
        className="flex min-h-dvh items-center justify-center bg-[var(--ml-dark-bg)] text-sm text-[var(--ml-dark-ink-muted)]"
      >
        Loading…
      </div>
    );
  }

  return (
    <div
      data-theme="ml-dark"
      className="relative flex min-h-dvh flex-col overflow-hidden bg-[var(--ml-dark-bg)] text-[var(--ml-dark-ink)]"
    >
      {/* Immersive property plane */}
      <div className="absolute inset-0" aria-hidden>
        <Image
          src="/booking/welcome-living.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--ml-dark-bg)]/75 via-[var(--ml-dark-bg)]/55 to-[var(--ml-dark-bg)]" />
        <div className="absolute inset-0 bg-[radial-gradient(80%_50%_at_50%_0%,rgb(8_224_212_/_0.18),transparent_60%)]" />
      </div>

      <div className="relative z-10 flex flex-1 flex-col px-6 pb-[max(2.5rem,env(safe-area-inset-bottom))] pt-[max(3rem,env(safe-area-inset-top))] sm:px-8">
        <div className="flex flex-col items-center text-center">
          <SiteLogo variant="mark" tone="brand" href={routes.home} priority className="scale-125" />
          <p className="mt-4 text-[11px] font-semibold tracking-[0.22em] text-[var(--ml-dark-mint)] uppercase">
            MaidLinx
          </p>
          <p className="mt-1 text-[10px] font-medium tracking-[0.28em] text-[var(--ml-dark-ink-muted)] uppercase">
            Your clean connection
          </p>
        </div>

        <div className="mt-auto flex flex-col items-stretch text-center sm:items-center">
          <h1 className="mx-auto max-w-md text-[1.85rem] font-semibold leading-tight tracking-tight text-white sm:text-[2.15rem]">
            Request a clean in minutes.
          </h1>
          <p className="mx-auto mt-3 max-w-sm text-[15px] leading-relaxed text-[var(--ml-dark-ink-muted)]">
            Choose · confirm · track your MaidLinx Pro.
          </p>

          <Button
            type="button"
            variant="primary"
            size="lg"
            className="booking-cta-btn mt-8 h-14 w-full max-w-sm rounded-2xl text-base font-semibold shadow-[0_0_32px_rgb(8_224_212_/_0.3)]"
            onClick={start}
          >
            Get Started
            <span aria-hidden>→</span>
          </Button>

          <p className="mt-5 text-sm text-[var(--ml-dark-ink-muted)]">
            Already have an account?{" "}
            <Link
              href={routes.signIn}
              className="font-medium text-white underline-offset-4 hover:underline"
            >
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
