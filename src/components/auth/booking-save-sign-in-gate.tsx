"use client";

import type { ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { isBookingAuthReturn } from "@/lib/bookings/booking-auth";
import { BookingSaveSignIn } from "@/components/auth/booking-save-sign-in";

/** Swap marketing sign-in for the Save-your-booking gate when from=booking. */
export function BookingSaveSignInGate({ children }: { children: ReactNode }) {
  const searchParams = useSearchParams();
  const fromBooking = isBookingAuthReturn(searchParams?.get("from"));
  const role = searchParams?.get("role");
  const next = searchParams?.get("next") ?? "";
  const isCleaner =
    role === "cleaner" || next.startsWith("/cleaner") || next.startsWith("/pro");

  if (fromBooking && !isCleaner) {
    return <BookingSaveSignIn />;
  }

  return children;
}
