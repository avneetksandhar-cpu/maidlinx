"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useBookingState } from "@/hooks/use-booking-state";
import type { BookingState } from "@/lib/bookings/booking-state";

interface BookingContextValue {
  state: BookingState;
  updateState: (value: Partial<BookingState>) => void;
  resetState: () => void;
  hydrated: boolean;
}

const BookingContext = createContext<BookingContextValue | null>(null);

export function BookingProvider({ children }: { children: ReactNode }) {
  const value = useBookingState();
  return <BookingContext.Provider value={value}>{children}</BookingContext.Provider>;
}

export function useBooking(): BookingContextValue {
  const ctx = useContext(BookingContext);
  if (!ctx) {
    throw new Error("useBooking must be used within BookingProvider");
  }
  return ctx;
}
