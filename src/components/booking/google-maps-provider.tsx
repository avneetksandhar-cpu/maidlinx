"use client";

import Script from "next/script";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  GoogleMapsContext,
  type GoogleMapsStatus,
} from "@/components/booking/google-maps-context";

const rawApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
const apiKey = rawApiKey?.trim() ? rawApiKey.trim() : undefined;

function mapsPlacesReady() {
  return Boolean(typeof window !== "undefined" && window.google?.maps?.places);
}

function isDev() {
  return process.env.NODE_ENV === "development";
}

export function GoogleMapsProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<GoogleMapsStatus>(() => {
    if (!apiKey) return "missing-key";
    if (mapsPlacesReady()) return "ready";
    return "loading";
  });

  useEffect(() => {
    if (!apiKey && isDev()) {
      console.error("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY missing");
    }
  }, []);

  useEffect(() => {
    if (!apiKey) return;

    const previous = window.gm_authFailure;
    window.gm_authFailure = () => {
      if (isDev()) {
        console.error(
          "[Google Maps] AuthFailure / gm_authFailure — key rejected. Check billing, Maps JavaScript API + Places API, and HTTP referrer restrictions (e.g. http://localhost:3001/*).",
        );
      }
      setStatus("error");
      previous?.();
    };

    return () => {
      window.gm_authFailure = previous;
    };
  }, []);

  useEffect(() => {
    if (!apiKey || status === "ready" || status === "error") return;

    const interval = window.setInterval(() => {
      if (mapsPlacesReady()) {
        setStatus("ready");
        window.clearInterval(interval);
      }
    }, 200);

    return () => window.clearInterval(interval);
  }, [status]);

  const value = useMemo(
    () => ({
      apiKey,
      status,
      isReady: status === "ready",
    }),
    [status],
  );

  return (
    <GoogleMapsContext.Provider value={value}>
      {apiKey ? (
        <Script
          id="google-maps-places"
          src={`https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=places&v=weekly`}
          strategy="afterInteractive"
          onLoad={() => {
            if (mapsPlacesReady()) {
              setStatus("ready");
              return;
            }
            if (isDev()) {
              console.error(
                "[Google Maps] Script loaded but places library unavailable. Ensure Places API (legacy) is enabled for this key.",
              );
            }
            setStatus("error");
          }}
          onError={() => {
            if (isDev()) {
              console.error(
                "[Google Maps] Script failed to load. Common causes: invalid key, referrer blocked, or network error.",
              );
            }
            setStatus("error");
          }}
        />
      ) : null}
      {children}
    </GoogleMapsContext.Provider>
  );
}

export { AddressAutocomplete } from "@/components/booking/address-autocomplete";
export { useGoogleMaps } from "@/components/booking/google-maps-context";
