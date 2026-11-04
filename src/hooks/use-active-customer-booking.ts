"use client";

import { useEffect, useState } from "react";
import { useAuthSession } from "@/hooks/use-auth-session";

export type ActiveCustomerBookingSummary = {
  id: string;
  status: string;
  serviceType: string;
  scheduledAt: string;
  addressLine1: string | null;
  addressCity: string | null;
  totalCents: number;
  currency: string;
  professionalName: string | null;
};

/**
 * Lightweight peek at the customer's next upcoming booking for app-open home.
 * Guests / unauthenticated → null. Failures stay silent (home still books).
 */
export function useActiveCustomerBooking(): {
  booking: ActiveCustomerBookingSummary | null;
  loading: boolean;
} {
  const authStatus = useAuthSession();
  const [booking, setBooking] = useState<ActiveCustomerBookingSummary | null>(null);
  const [loading, setLoading] = useState(authStatus === "loading" || authStatus === "authenticated");

  useEffect(() => {
    if (authStatus !== "authenticated") {
      setBooking(null);
      setLoading(authStatus === "loading");
      return;
    }

    let cancelled = false;
    setLoading(true);

    void (async () => {
      try {
        const res = await fetch("/api/dashboard", { credentials: "include" });
        if (!res.ok) {
          if (!cancelled) setBooking(null);
          return;
        }
        const json = (await res.json()) as {
          data?: { upcoming?: ActiveCustomerBookingSummary[] };
          upcoming?: ActiveCustomerBookingSummary[];
        };
        const upcoming = json.data?.upcoming ?? json.upcoming ?? [];
        if (!cancelled) setBooking(upcoming[0] ?? null);
      } catch {
        if (!cancelled) setBooking(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authStatus]);

  return { booking, loading };
}
