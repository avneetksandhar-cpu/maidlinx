"use client";

import type { PriceBreakdown } from "@/lib/pricing/calculate";
import { PriceSummary } from "@/components/booking/price-summary";

interface PriceReviewStepProps {
  pricing: PriceBreakdown | null;
  loading: boolean;
  error: string | null;
  isServerVerified: boolean;
}

export function PriceReviewStep({
  pricing,
  loading,
  error,
  isServerVerified,
}: PriceReviewStepProps) {
  return (
    <div>
      {error ? (
        <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-error">{error}</p>
      ) : null}

      <PriceSummary
        pricing={pricing}
        loading={loading}
        variant="embedded"
        showDeposit
        isServerVerified={isServerVerified}
      />
    </div>
  );
}
