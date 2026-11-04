"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { emptyBookingState, loadBookingState, saveBookingState } from "@/lib/booking-flow/storage";
import type { NightBookingState } from "@/lib/booking-flow/types";

type BookingContextValue = {
  state: NightBookingState;
  hydrated: boolean;
  patch: (partial: Partial<NightBookingState>) => void;
  reset: () => void;
};

const BookingContext = createContext<BookingContextValue | null>(null);

export function BookingProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<NightBookingState>(emptyBookingState);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setState(loadBookingState());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    saveBookingState(state);
  }, [state, hydrated]);

  const value = useMemo<BookingContextValue>(
    () => ({
      state,
      hydrated,
      patch: (partial) => setState((current) => ({ ...current, ...partial })),
      reset: () => setState(emptyBookingState()),
    }),
    [state, hydrated],
  );

  return <BookingContext.Provider value={value}>{children}</BookingContext.Provider>;
}

export function useNightBooking() {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error("useNightBooking must be used inside BookingProvider");
  }
  return context;
}
