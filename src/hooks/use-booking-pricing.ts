"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchBookingQuote } from "@/lib/bookings/client-api";
import { calculateBookingPrice, type PriceBreakdown } from "@/lib/pricing/calculate";
import type { BookingQuoteInput } from "@/lib/validations/booking-flow";

interface UseBookingPricingOptions {
  quoteInput: BookingQuoteInput | null;
  enabled: boolean;
}

export function useBookingPricing({ quoteInput, enabled }: UseBookingPricingOptions) {
  const [serverPricing, setServerPricing] = useState<PriceBreakdown | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const previewPricing = useMemo(() => {
    if (!quoteInput) return null;
    try {
      return calculateBookingPrice(quoteInput);
    } catch {
      return null;
    }
  }, [quoteInput]);

  useEffect(() => {
    if (!enabled || !quoteInput) {
      return;
    }

    let cancelled = false;

    void (async () => {
      setLoading(true);
      setError(null);

      try {
        const result = await fetchBookingQuote(quoteInput);
        if (!cancelled) setServerPricing(result);
      } catch (err) {
        if (!cancelled) {
          setServerPricing(null);
          setError(err instanceof Error ? err.message : "Unable to fetch quote.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [quoteInput, enabled]);

  const pricing = useMemo(() => {
    if (!enabled || !quoteInput) return null;
    return serverPricing ?? previewPricing;
  }, [enabled, quoteInput, serverPricing, previewPricing]);

  const activeLoading = enabled && Boolean(quoteInput) && loading;
  const activeError = enabled && quoteInput ? error : null;
  const isServerVerified = enabled && Boolean(quoteInput) && Boolean(serverPricing);

  return {
    pricing,
    previewPricing: enabled && quoteInput ? previewPricing : null,
    serverPricing: enabled && quoteInput ? serverPricing : null,
    loading: activeLoading,
    error: activeError,
    isServerVerified,
  };
}
