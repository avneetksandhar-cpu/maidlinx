"use client";

import { useEffect, useRef } from "react";
import type { RealtimeChannel, SupabaseClient } from "@supabase/supabase-js";
import {
  fetchBooking,
  getStoredBookingAccessToken,
  isBookingPaymentConfirmed,
  pollBookingUntilConfirmed,
} from "@/lib/bookings/client-api";
import type { StoredBooking } from "@/lib/bookings/repository";
import { createClient } from "@/lib/supabase/client";

interface UseCustomerBookingLiveOptions {
  bookingId: string;
  accessToken?: string | null;
  initialBooking?: StoredBooking | null;
  onBooking: (booking: StoredBooking) => void;
  onError?: (message: string) => void;
  /** Poll interval when realtime is unavailable. */
  pollMs?: number;
}

/**
 * Prefer Supabase realtime on the authorized booking row; always keep a safe poll fallback.
 * Does not subscribe when the browser lacks anon env (createClient would throw).
 */
export function useCustomerBookingLive({
  bookingId,
  accessToken,
  initialBooking = null,
  onBooking,
  onError,
  pollMs = 8_000,
}: UseCustomerBookingLiveOptions): void {
  const onBookingRef = useRef(onBooking);
  const onErrorRef = useRef(onError);
  onBookingRef.current = onBooking;
  onErrorRef.current = onError;

  useEffect(() => {
    let cancelled = false;
    const token = accessToken ?? getStoredBookingAccessToken(bookingId);
    let supabase: SupabaseClient | null = null;
    let channel: RealtimeChannel | null = null;

    async function loadOnce() {
      try {
        const latest = await fetchBooking(bookingId, token);
        if (!cancelled) onBookingRef.current(latest);
        return latest;
      } catch (err) {
        if (!cancelled) {
          onErrorRef.current?.(
            err instanceof Error ? err.message : "Unable to load booking.",
          );
        }
        return null;
      }
    }

    async function bootstrap() {
      if (!initialBooking) {
        await loadOnce();
        return;
      }
      if (
        initialBooking.status === "pending_payment" ||
        !isBookingPaymentConfirmed(initialBooking.status)
      ) {
        try {
          const confirmed = await pollBookingUntilConfirmed(bookingId, token);
          if (!cancelled) onBookingRef.current(confirmed);
        } catch {
          await loadOnce();
        }
      }
    }

    void bootstrap();

    const interval = window.setInterval(() => {
      void loadOnce();
    }, pollMs);

    try {
      supabase = createClient();
      channel = supabase
        .channel(`customer-booking:${bookingId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "bookings",
            filter: `id=eq.${bookingId}`,
          },
          () => {
            void loadOnce();
          },
        )
        .subscribe();
    } catch {
      // Missing env or realtime unavailable — poll fallback remains.
    }

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      if (supabase && channel) {
        void supabase.removeChannel(channel);
      }
    };
  }, [bookingId, accessToken, initialBooking, pollMs]);
}
