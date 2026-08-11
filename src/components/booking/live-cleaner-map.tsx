"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin, Navigation } from "lucide-react";
import { useGoogleMaps } from "@/components/booking/google-maps-context";
import { isLiveLocationStatus } from "@/lib/bookings/status";
import { cn } from "@/lib/utils";

interface LiveLocationPayload {
  available: boolean;
  reason?: string;
  lat?: number;
  lng?: number;
  accuracy?: number | null;
  updatedAt?: string;
  etaMinutes?: number | null;
  customerLat?: number | null;
  customerLng?: number | null;
  status?: string;
}

interface LiveCleanerMapProps {
  bookingId: string;
  accessToken?: string | null;
  status: string;
  customerLat?: number | null;
  customerLng?: number | null;
  addressLabel: string;
  className?: string;
  /** Hide internal title when parent already shows live status copy. */
  showHeader?: boolean;
}

function formatUpdatedAt(iso?: string): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  const seconds = Math.round((Date.now() - date.getTime()) / 1000);
  if (seconds < 45) return "Updated just now";
  if (seconds < 120) return "Updated about a minute ago";
  if (seconds < 3600) return `Updated ${Math.round(seconds / 60)} min ago`;
  return `Updated ${date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
}

/**
 * Customer live map while cleaner is on the way / arrived.
 * Prefers Maps JS markers; falls back to a premium pin card (Static Maps often 403).
 */
export function LiveCleanerMap({
  bookingId,
  accessToken,
  status,
  customerLat,
  customerLng,
  addressLabel,
  className,
  showHeader = true,
}: LiveCleanerMapProps) {
  const maps = useGoogleMaps();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const cleanerMarkerRef = useRef<google.maps.Marker | null>(null);
  const customerMarkerRef = useRef<google.maps.Marker | null>(null);
  const [location, setLocation] = useState<LiveLocationPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  const tracking = isLiveLocationStatus(status);
  const activeLocation = tracking ? location : null;

  useEffect(() => {
    if (!tracking) return;

    let cancelled = false;

    async function load() {
      try {
        const tokenQuery = accessToken
          ? `?token=${encodeURIComponent(accessToken)}`
          : "";
        const response = await fetch(`/api/bookings/${bookingId}/location${tokenQuery}`, {
          credentials: "include",
          headers: accessToken
            ? { "x-booking-access-token": accessToken }
            : undefined,
        });
        if (!response.ok) {
          if (!cancelled) setError("Unable to load live tracking right now.");
          return;
        }
        const payload = (await response.json()) as { data?: { location?: LiveLocationPayload } };
        if (!cancelled) {
          setLocation(payload.data?.location ?? null);
          setError(null);
        }
      } catch {
        if (!cancelled) setError("Unable to load live tracking right now.");
      }
    }

    void load();
    const interval = window.setInterval(() => void load(), 10_000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [tracking, bookingId, accessToken]);

  useEffect(() => {
    if (
      !tracking ||
      !activeLocation?.available ||
      activeLocation.lat == null ||
      activeLocation.lng == null
    ) {
      return;
    }
    if (!maps.isReady || !mapRef.current || !window.google?.maps) return;

    const cleanerPos = { lat: activeLocation.lat, lng: activeLocation.lng };
    const homeLat = activeLocation.customerLat ?? customerLat;
    const homeLng = activeLocation.customerLng ?? customerLng;
    const hasHome =
      typeof homeLat === "number" &&
      typeof homeLng === "number" &&
      Number.isFinite(homeLat) &&
      Number.isFinite(homeLng);

    if (!mapInstanceRef.current) {
      mapInstanceRef.current = new google.maps.Map(mapRef.current, {
        center: cleanerPos,
        zoom: 13,
        disableDefaultUI: true,
        zoomControl: true,
        gestureHandling: "cooperative",
        clickableIcons: false,
      });
      cleanerMarkerRef.current = new google.maps.Marker({
        map: mapInstanceRef.current,
        position: cleanerPos,
        title: "MaidLinx Pro",
        label: { text: "P", color: "#fff", fontWeight: "700" },
      });
      if (hasHome) {
        customerMarkerRef.current = new google.maps.Marker({
          map: mapInstanceRef.current,
          position: { lat: homeLat, lng: homeLng },
          title: "Your location",
          label: { text: "H", color: "#fff", fontWeight: "700" },
        });
      }
    } else {
      cleanerMarkerRef.current?.setPosition(cleanerPos);
      if (hasHome) {
        if (!customerMarkerRef.current) {
          customerMarkerRef.current = new google.maps.Marker({
            map: mapInstanceRef.current,
            position: { lat: homeLat, lng: homeLng },
            title: "Your location",
            label: { text: "H", color: "#fff", fontWeight: "700" },
          });
        } else {
          customerMarkerRef.current.setPosition({ lat: homeLat, lng: homeLng });
        }
      }
    }

    if (hasHome && mapInstanceRef.current) {
      const bounds = new google.maps.LatLngBounds();
      bounds.extend(cleanerPos);
      bounds.extend({ lat: homeLat, lng: homeLng });
      mapInstanceRef.current.fitBounds(bounds, 48);
    } else {
      mapInstanceRef.current?.panTo(cleanerPos);
    }
  }, [tracking, activeLocation, maps.isReady, customerLat, customerLng]);

  useEffect(() => {
    return () => {
      cleanerMarkerRef.current?.setMap(null);
      customerMarkerRef.current?.setMap(null);
      mapInstanceRef.current = null;
      cleanerMarkerRef.current = null;
      customerMarkerRef.current = null;
    };
  }, []);

  if (!tracking) return null;

  const updatedLabel = formatUpdatedAt(activeLocation?.updatedAt);
  const title =
    status === "arrived"
      ? "Your MaidLinx Pro has arrived"
      : "Your MaidLinx Pro is on the way";

  const showJsMap =
    maps.isReady && activeLocation?.available && activeLocation.lat != null;

  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-[#E2E9E6] bg-white",
        className,
      )}
    >
      {showHeader ? (
        <div className="space-y-1 px-4 pt-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-ink">
            <Navigation className="size-4 text-accent" aria-hidden />
            {title}
          </p>
          {activeLocation?.etaMinutes != null ? (
            <p className="text-sm font-medium text-accent">
              ETA ~{activeLocation.etaMinutes} min
            </p>
          ) : null}
          {updatedLabel ? <p className="text-xs text-ink-muted">{updatedLabel}</p> : null}
          {!activeLocation?.available ? (
            <p className="text-sm text-ink-muted">
              {error ?? activeLocation?.reason ?? "Waiting for live location…"}
            </p>
          ) : null}
        </div>
      ) : null}

      {!showHeader && activeLocation?.etaMinutes != null ? (
        <p className="px-1 pb-2 text-sm font-medium text-accent">
          ETA ~{activeLocation.etaMinutes} min
        </p>
      ) : null}
      {!showHeader && !activeLocation?.available ? (
        <p className="px-1 pb-2 text-sm text-ink-muted">
          {error ?? activeLocation?.reason ?? "Waiting for live location…"}
        </p>
      ) : null}

      <div className={cn("relative aspect-[16/9] w-full bg-[#F1F8F5]", showHeader && "mt-3")}>
        {showJsMap ? (
          <div ref={mapRef} className="absolute inset-0 h-full w-full" />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 px-4 text-center">
            <span className="flex size-11 items-center justify-center rounded-full bg-white shadow-soft ring-1 ring-[#E2E9E6]">
              <MapPin className="size-5 text-accent" aria-hidden />
            </span>
            <p className="text-sm font-semibold text-ink">Map unavailable</p>
            <p className="max-w-xs text-sm text-ink-muted">{addressLabel}</p>
          </div>
        )}
      </div>
    </div>
  );
}
