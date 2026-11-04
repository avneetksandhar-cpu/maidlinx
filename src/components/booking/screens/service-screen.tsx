"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Box, ChevronRight, Sparkles, SprayCan } from "lucide-react";
import { BookingFlowChrome } from "@/components/booking/booking-flow-chrome";
import { useBooking } from "@/components/booking/booking-provider";
import { useBookingGuard } from "@/components/booking/use-booking-guard";
import { useReturnToReview } from "@/components/booking/use-return-to-review";
import { useFinishBookingTitle } from "@/components/booking/use-finish-booking-title";
import { BOOKING_SCREEN_PATHS } from "@/lib/bookings/booking-routes";
import { getServiceBySlug } from "@/config/services";
import { trackBookingEvent } from "@/lib/analytics/booking";
import { routes } from "@/config/site";

const CLEAN_OPTIONS = [
  {
    id: "standard",
    serviceType: "standard" as const,
    serviceSlug: "residential",
    label: "Standard clean",
    subtitle: "Everyday upkeep",
    icon: SprayCan,
  },
  {
    id: "deep",
    serviceType: "deep" as const,
    serviceSlug: "deep-clean",
    label: "Deep clean",
    subtitle: "A more thorough reset",
    icon: Sparkles,
  },
  {
    id: "move_out",
    serviceType: "move_out" as const,
    serviceSlug: "move-out",
    label: "Move-out clean",
    subtitle: "An empty home, ready for its next chapter",
    icon: Box,
  },
] as const;

/** Panel 2 — Choose your clean. Full tappable rows → Make it yours. */
export function ServiceScreen() {
  const router = useRouter();
  const { updateState } = useBooking();
  const { hydrated, blocked } = useBookingGuard("service");
  const { fromReview, reviewPath } = useReturnToReview();
  const title = useFinishBookingTitle("Choose your clean");

  if (!hydrated || blocked) {
    return (
      <div
        data-theme="ml-book"
        className="flex min-h-[40dvh] items-center justify-center bg-[var(--ml-book-bg,#01193D)] text-sm text-[var(--ml-book-ink-muted)]"
      >
        Loading…
      </div>
    );
  }

  const selectClean = (opt: (typeof CLEAN_OPTIONS)[number]) => {
    const service = getServiceBySlug(opt.serviceSlug);
    trackBookingEvent("service_selected", {
      tierId: opt.id,
      serviceType: opt.serviceType,
    });
    updateState({
      propertyType: opt.serviceType === "move_out" ? "move" : "condo",
      serviceTierId: opt.id === "move_out" ? null : opt.id,
      serviceType: opt.serviceType,
      serviceSlug: service?.slug ?? opt.serviceSlug,
      serviceTile: "home",
      bedrooms: 2,
      bathrooms: 1,
      squareFootage: 1200,
      extras: [],
      serviceAnswers: {
        propertyType: opt.serviceType === "move_out" ? "move" : "condo",
        bookingCategory: "home",
        ...(opt.serviceType === "move_out" ? { moveDirection: "move_out" } : {}),
      },
      step: 3,
    });
    router.push(fromReview ? reviewPath : BOOKING_SCREEN_PATHS.details);
  };

  return (
    <BookingFlowChrome
      screenId="service"
      title={title}
      hideCta
      hideDefaultTotal
      backHref={fromReview ? reviewPath : routes.home}
    >
      <div className="space-y-1">
        {CLEAN_OPTIONS.map((opt) => {
          const Icon = opt.icon;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => selectClean(opt)}
              className="flex w-full items-center gap-3 border-b border-white/15 py-4 text-left last:border-0"
            >
              <span className="flex size-10 shrink-0 items-center justify-center text-[#04CED2]">
                <Icon className="size-6" strokeWidth={1.75} aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[17px] font-semibold text-white">{opt.label}</span>
                <span className="mt-0.5 block text-[15px] text-white/65">{opt.subtitle}</span>
              </span>
              <ChevronRight className="size-5 shrink-0 text-[#04CED2]" aria-hidden />
            </button>
          );
        })}
      </div>

      <Link
        href={`${routes.home}#whats-included`}
        className="mt-6 inline-flex items-center gap-1 text-[15px] font-semibold text-[#04CED2]"
      >
        Compare services
        <ChevronRight className="size-4" aria-hidden />
      </Link>
    </BookingFlowChrome>
  );
}
