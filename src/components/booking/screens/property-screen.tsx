"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { MapPin } from "lucide-react";
import { BookingFlowChrome } from "@/components/booking/booking-flow-chrome";
import {
  CategoryCards,
  type BookingCategoryId,
} from "@/components/booking/category-cards";
import { useBooking } from "@/components/booking/booking-provider";
import { useBookingGuard } from "@/components/booking/use-booking-guard";
import { BOOKING_SCREEN_PATHS } from "@/lib/bookings/booking-routes";
import { getPropertyType, type PropertyTypeId } from "@/config/property-types";
import type { ServiceAnswers } from "@/lib/services/questions";
import { trackBookingEvent } from "@/lib/analytics/booking";

export function PropertyScreen() {
  const router = useRouter();
  const { updateState } = useBooking();
  const { state, hydrated, blocked } = useBookingGuard("property");

  const selectCategory = (propertyType: PropertyTypeId, categoryId: BookingCategoryId) => {
    const property = getPropertyType(propertyType);
    trackBookingEvent("property_selected", { propertyType, categoryId });
    const nextAnswers: ServiceAnswers = {
      ...(state.serviceAnswers ?? {}),
      propertyType,
      bookingCategory: categoryId,
    };
    if (
      propertyType === "retail" ||
      propertyType === "restaurant" ||
      propertyType === "office" ||
      propertyType === "commercial"
    ) {
      nextAnswers.businessType = propertyType === "commercial" ? "other" : propertyType;
    }

    updateState({
      propertyType,
      serviceAnswers: nextAnswers,
      serviceType: property?.defaultServiceType,
      serviceSlug: property?.defaultServiceSlug,
      serviceTierId: null,
      bedrooms: property?.questionSet === "commercial" ? 0 : (state.bedrooms ?? 2),
      bathrooms: state.bathrooms ?? (property?.questionSet === "commercial" ? 1 : 2),
      squareFootage: state.squareFootage ?? 1500,
      step: 2,
    });

    router.push(BOOKING_SCREEN_PATHS.service);
  };

  if (!hydrated || blocked) {
    return (
      <div
        data-theme="ml-dark"
        className="flex min-h-[40dvh] items-center justify-center bg-[var(--ml-dark-bg)] text-sm text-[var(--ml-dark-ink-muted)]"
      >
        Loading…
      </div>
    );
  }

  const locationLabel =
    state.marketName ||
    [state.city, state.state].filter(Boolean).join(", ") ||
    "Select your city";

  return (
    <BookingFlowChrome
      screenId="property"
      title="What needs cleaning?"
      subtitle="Tap one to continue."
      hideCta
      locationSlot={
        <div className="flex items-center gap-2 text-sm text-[var(--ml-dark-ink-muted)]">
          <MapPin className="size-4 shrink-0 text-[var(--ml-dark-mint)]" aria-hidden />
          <span className="font-medium text-[var(--ml-dark-ink)]">{locationLabel}</span>
          <Link
            href={BOOKING_SCREEN_PATHS.address}
            className="ml-auto font-medium text-[var(--ml-dark-mint)] underline-offset-4 hover:underline"
          >
            Change
          </Link>
        </div>
      }
    >
      <CategoryCards
        value={state.propertyType === "condo" ? "apartment" : state.propertyType}
        onChange={selectCategory}
      />
    </BookingFlowChrome>
  );
}
