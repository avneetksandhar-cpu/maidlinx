"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Home } from "lucide-react";
import { useBookingState } from "@/hooks/use-booking-state";
import {
  readUsualClean,
  usualCleanToBookingPatch,
  type UsualCleanProfile,
} from "@/lib/bookings/usual-clean";
import { BOOKING_SCREEN_PATHS } from "@/lib/bookings/booking-routes";
import { getBookingServiceLabel, BOOKING_EXTRAS } from "@/lib/bookings/constants";
import { trackBookingEvent } from "@/lib/analytics/booking";
import { buildAddressStatePatch, buildQuoteInput } from "@/lib/bookings/booking-helpers";
import { useBookingPricing } from "@/hooks/use-booking-pricing";
import { resolveSchedulePreset } from "@/lib/bookings/schedule-presets";
import {
  formatArrivesWindowLabel,
  formatBookingDateShort,
} from "@/lib/bookings/arrival-labels";
import type { ArrivalWindowId } from "@/lib/bookings/constants";
import { formatCurrency } from "@/lib/utils";
import { usualNewTimeHref } from "@/lib/home/resume-cta";

interface HomeUsualCleanCardProps {
  className?: string;
  ctaLabel?: string;
  onBeforeNavigate?: () => void;
}

/**
 * “Choose a new time” — keep home + service + extras; clear schedule;
 * show current price + next opening together before confirm on arrival panel.
 */
export function HomeUsualCleanCard({
  className,
  ctaLabel = "Choose a new time",
  onBeforeNavigate,
}: HomeUsualCleanCardProps) {
  const router = useRouter();
  const { state, updateState } = useBookingState();
  const [profile] = useState<UsualCleanProfile | null>(() =>
    typeof window === "undefined" ? null : readUsualClean(),
  );

  const previewState = useMemo(() => {
    if (!profile) return null;
    const patch = usualCleanToBookingPatch(profile);
    return { ...state, ...buildAddressStatePatch(state, patch), ...patch };
  }, [profile, state]);

  const quoteInput = useMemo(
    () =>
      previewState
        ? buildQuoteInput(previewState, { requireAddress: true, allowPreview: true })
        : null,
    [previewState],
  );
  const { pricing, loading } = useBookingPricing({
    quoteInput,
    enabled: Boolean(quoteInput && previewState?.serviceType),
  });

  const nextOpening = useMemo(() => {
    const resolved = resolveSchedulePreset("asap", {
      arrivalWindow: (profile?.arrivalWindow as ArrivalWindowId | undefined) ?? undefined,
    });
    return {
      date: formatBookingDateShort(resolved.date),
      window: formatArrivesWindowLabel(resolved.arrivalWindow),
    };
  }, [profile?.arrivalWindow]);

  if (!profile?.line1 || !profile.serviceType) return null;

  const place =
    profile.formattedAddress ||
    [profile.line1, profile.city].filter(Boolean).join(", ");
  const serviceLabel = getBookingServiceLabel(profile.serviceType);
  const extrasLabel =
    (profile.extras?.length ?? 0) === 0
      ? null
      : profile.extras!
          .map((id) => BOOKING_EXTRAS.find((e) => e.id === id)?.label ?? id)
          .join(", ");
  const priceLabel =
    pricing && !pricing.quoteOnly
      ? formatCurrency(pricing.totalCents, pricing.currency)
      : loading
        ? "…"
        : null;

  return (
    <section
      className={`rounded-2xl border border-white/15 bg-[#102B49] p-4 text-left ${className ?? ""}`}
    >
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-[#04CED2]">
          <Home className="size-5" strokeWidth={2} aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-white">Your usual clean</p>
          <p className="mt-0.5 truncate text-[15px] text-white/85">{place}</p>
          <p className="mt-1 text-[14px] text-white/70">
            {serviceLabel}
            {extrasLabel ? ` · ${extrasLabel}` : ""}
          </p>
          <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-[14px]">
            {priceLabel ? (
              <span className="font-semibold tabular-nums text-white">
                {priceLabel}
                <span className="ml-1 font-normal text-white/60">current</span>
              </span>
            ) : null}
            <span className="text-white/70">
              Next: {nextOpening.date} · {nextOpening.window.replace(/^Arrives\s+/i, "")}
            </span>
          </div>
        </div>
      </div>
      <button
        type="button"
        className="mt-3 inline-flex h-12 w-full items-center justify-center rounded-xl bg-[#04CED2] text-[15px] font-semibold text-[#01193D] transition-opacity hover:opacity-95"
        onClick={() => {
          const patch = usualCleanToBookingPatch(profile);
          const next = buildAddressStatePatch(state, patch);
          // Keep home / service / extras; clear schedule so they pick a fresh window.
          updateState({
            ...next,
            ...patch,
            date: undefined,
            schedulePreset: undefined,
            arrivalWindow: undefined,
          });
          onBeforeNavigate?.();
          trackBookingEvent("booking_started", { entry: "usual_clean_home" });
          router.push(usualNewTimeHref() || BOOKING_SCREEN_PATHS.date);
        }}
      >
        {ctaLabel}
      </button>
    </section>
  );
}
