"use client";

import { useEffect, useRef } from "react";
import { MapPin } from "lucide-react";
import { useGoogleMaps } from "@/components/booking/google-maps-context";
import { cn } from "@/lib/utils";

interface BookingMapPreviewProps {
  latitude?: number | null;
  longitude?: number | null;
  label: string;
  className?: string;
  /** Compact height for dense layouts */
  compact?: boolean;
}

function MapFallback({ label, compact }: { label: string; compact?: boolean }) {
  return (
    <div
      className={cn(
        "relative flex w-full flex-col items-center justify-center gap-2 overflow-hidden bg-gradient-to-br from-[#F1F8F5] via-[#EAF4F0] to-[#DCEAE4] px-5 text-center",
        compact ? "min-h-[140px]" : "aspect-[16/9] min-h-[160px]",
      )}
      role="img"
      aria-label={`Map unavailable for ${label}`}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgb(8 127 101 / 0.18) 1px, transparent 0)",
          backgroundSize: "18px 18px",
        }}
        aria-hidden
      />
      <span className="relative flex size-12 items-center justify-center rounded-full bg-white shadow-soft ring-1 ring-[#E2E9E6]">
        <MapPin className="size-6 text-accent" strokeWidth={2} aria-hidden />
      </span>
      <p className="relative text-sm font-semibold text-ink">Map unavailable</p>
      <p className="relative max-w-[18rem] text-xs leading-snug text-ink-muted">{label}</p>
    </div>
  );
}

/**
 * Location preview for Access / Review / Confirmation.
 * Prefers Maps JavaScript API when ready + coords exist.
 * Never renders a broken Static Maps <img> (Static Maps often 403 when not enabled).
 */
export function BookingMapPreview({
  latitude,
  longitude,
  label,
  className,
  compact = false,
}: BookingMapPreviewProps) {
  const maps = useGoogleMaps();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);

  const hasCoords =
    typeof latitude === "number" &&
    Number.isFinite(latitude) &&
    typeof longitude === "number" &&
    Number.isFinite(longitude);

  const canShowJsMap = hasCoords && maps.isReady && Boolean(maps.apiKey);

  useEffect(() => {
    if (!canShowJsMap || !mapRef.current || !window.google?.maps) return;
    if (latitude == null || longitude == null) return;

    const position = { lat: latitude, lng: longitude };

    try {
      if (!mapInstanceRef.current) {
        mapInstanceRef.current = new google.maps.Map(mapRef.current, {
          center: position,
          zoom: 15,
          disableDefaultUI: true,
          zoomControl: false,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          gestureHandling: "none",
          clickableIcons: false,
          styles: [
            { featureType: "poi", stylers: [{ visibility: "off" }] },
            { featureType: "transit", stylers: [{ visibility: "off" }] },
          ],
        });
        markerRef.current = new google.maps.Marker({
          map: mapInstanceRef.current,
          position,
          title: label,
        });
      } else {
        mapInstanceRef.current.setCenter(position);
        markerRef.current?.setPosition(position);
      }
    } catch {
      // Leave mint container; never fall back to a broken Static Maps <img>.
    }
  }, [canShowJsMap, latitude, longitude, label]);

  useEffect(() => {
    return () => {
      markerRef.current?.setMap(null);
      markerRef.current = null;
      mapInstanceRef.current = null;
    };
  }, []);

  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-[#E2E9E6] bg-white shadow-soft",
        className,
      )}
    >
      {canShowJsMap ? (
        <div
          className={cn(
            "relative w-full overflow-hidden bg-[#F1F8F5]",
            compact ? "h-[140px]" : "aspect-[16/9] min-h-[160px]",
          )}
        >
          <div
            ref={mapRef}
            className="absolute inset-0 h-full w-full overflow-hidden"
            aria-hidden
          />
          <span className="sr-only">Map showing {label}</span>
        </div>
      ) : (
        <MapFallback label={label} compact={compact} />
      )}
      <div className="flex items-start gap-2.5 border-t border-[#E2E9E6] bg-white px-4 py-3.5">
        <MapPin className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
        <p className="text-[15px] font-medium leading-snug text-ink">{label}</p>
      </div>
    </div>
  );
}
