"use client";

import { LocationSearch } from "@/components/booking-flow/LocationSearch";
import { PhoneFrame } from "@/components/booking-flow/PhoneFrame";
import { PrimaryButton } from "@/components/booking-flow/PrimaryButton";
import { WingmanHeader } from "@/components/booking-flow/WingmanHeader";
import { BottomNav } from "@/components/layout/BottomNav";
import { STEP_PATHS } from "@/lib/booking-flow/copy";
import { mapEmbedSrc, nearestMiamiPlace } from "@/lib/booking-flow/locations";
import { useNightBooking } from "@/lib/booking-flow/provider";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function LocationScreen() {
  const router = useRouter();
  const { state, patch } = useNightBooking();
  const [areas, setAreas] = useState<string[]>([]);
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    void fetch("/api/events?when=all")
      .then((response) => (response.ok ? response.json() : { events: [] }))
      .then((payload: { events?: Array<{ neighborhood?: string; area?: string }> }) => {
        const labels = (payload.events ?? [])
          .flatMap((event) => [event.neighborhood, event.area])
          .filter((value): value is string => Boolean(value && value.trim()));
        setAreas(Array.from(new Set(labels)));
      })
      .catch(() => setAreas([]));
  }, []);

  function useCurrent() {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        patch({ destination: nearestMiamiPlace(position.coords.latitude, position.coords.longitude) });
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: false, timeout: 8000 },
    );
  }

  return (
    <PhoneFrame>
      <div className="relative flex min-h-dvh flex-col bg-[#050508] pb-[calc(5.5rem+env(safe-area-inset-bottom))] text-white">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="flex flex-1 flex-col px-6 pt-[max(24px,env(safe-area-inset-top))]"
        >
          <WingmanHeader />
          <h1 className="mt-10 text-[22px] font-medium leading-7 tracking-[-0.02em]">
            Where are you going tonight?
          </h1>
          <div className="mt-8">
            <LocationSearch
              value={state.destination}
              extraLabels={areas}
              onChange={(destination) => patch({ destination })}
              onUseCurrent={useCurrent}
              locating={locating}
            />
          </div>
          <div className="mt-8 overflow-hidden rounded-[16px]">
            {state.destination ? (
              <iframe
                title="Map preview"
                src={mapEmbedSrc(state.destination)}
                className="h-40 w-full border-0"
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src="/photos/miami-night.jpg" alt="Miami at night" className="h-40 w-full object-cover" />
            )}
          </div>
          <div className="mt-auto pt-8">
            <PrimaryButton disabled={!state.destination} onClick={() => router.push(STEP_PATHS.when)}>
              Plan my night
            </PrimaryButton>
          </div>
        </motion.div>
        <BottomNav />
      </div>
    </PhoneFrame>
  );
}
