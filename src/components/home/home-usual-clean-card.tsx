"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Home } from "lucide-react";
import { useBookingState } from "@/hooks/use-booking-state";
import {
  readUsualClean,
  usualCleanToBookingPatch,
  type UsualCleanProfile,
} from "@/lib/bookings/usual-clean";
import { BOOKING_SCREEN_PATHS, getFurthestScreenPath } from "@/lib/bookings/booking-routes";
import { getBookingServiceLabel } from "@/lib/bookings/constants";
import { trackBookingEvent } from "@/lib/analytics/booking";
import { buildAddressStatePatch } from "@/lib/bookings/booking-helpers";

/**
 * “Book my usual clean” — reuses saved local scope; never invents price or slots.
 * Lands on furthest incomplete step (usually date/review) with draft preserved.
 */
export function HomeUsualCleanCard() {
  const router = useRouter();
  const { state, updateState } = useBookingState();
  const [profile] = useState<UsualCleanProfile | null>(() =>
    typeof window === "undefined" ? null : readUsualClean(),
  );

  if (!profile?.line1 || !profile.serviceType) return null;

  const place =
    profile.formattedAddress ||
    [profile.line1, profile.city].filter(Boolean).join(", ");
  const serviceLabel = getBookingServiceLabel(profile.serviceType);

  return (
    <section className="rounded-2xl border border-slate-200/90 bg-white p-4 text-left shadow-[0_4px_16px_rgb(0_52_116_/_0.05)]">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-[#003474]">
          <Home className="size-5" strokeWidth={2} aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-[#003474]">Book my usual clean</p>
          <p className="mt-0.5 truncate text-sm text-slate-600">{place}</p>
          <p className="mt-0.5 text-xs text-slate-500">
            {serviceLabel}
            {profile.extras?.length ? ` · ${profile.extras.length} extras` : ""} — current price
            and availability shown next
          </p>
        </div>
      </div>
      <button
        type="button"
        className="mt-3 inline-flex h-11 w-full items-center justify-center rounded-xl border border-[#003474]/15 bg-[#003474] text-sm font-semibold text-white transition-opacity hover:opacity-95"
        onClick={() => {
          const patch = usualCleanToBookingPatch(profile);
          const next = buildAddressStatePatch(state, patch);
          updateState({ ...next, ...patch });
          trackBookingEvent("booking_started", { entry: "usual_clean_home" });
          const merged = { ...state, ...next, ...patch };
          const path = getFurthestScreenPath(merged) || BOOKING_SCREEN_PATHS.date;
          router.push(path);
        }}
      >
        Book my usual clean
      </button>
    </section>
  );
}
