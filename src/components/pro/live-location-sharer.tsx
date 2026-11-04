"use client";

import { useEffect, useRef, useState } from "react";
import { canShareLiveLocation } from "@/lib/location/live-location";
import {
  LOCATION_FINDING_MESSAGE,
  locationFailureMessage,
  queryGeolocationPermission,
} from "@/lib/addresses/geolocation";

const SHARE_INTERVAL_MS = 15_000;

interface LiveLocationSharerProps {
  jobId: string;
  status: string;
}

/**
 * Periodically shares the cleaner's current GPS while the job is en route / arrived.
 * Stops on status change, unmount, or permission denial (no re-prompt spam).
 */
export function LiveLocationSharer({ jobId, status }: LiveLocationSharerProps) {
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const deniedRef = useRef(false);
  const watchIdRef = useRef<number | null>(null);
  const lastSentRef = useRef(0);
  const enabled = canShareLiveLocation(status);
  const geoSupported =
    typeof navigator !== "undefined" && Boolean(navigator.geolocation);

  useEffect(() => {
    if (!enabled) {
      if (watchIdRef.current != null && typeof navigator !== "undefined") {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      return;
    }

    if (!geoSupported || deniedRef.current) {
      return;
    }

    let cancelled = false;
    let intervalId: number | null = null;

    async function startSharing() {
      const permission = await queryGeolocationPermission();
      if (cancelled) return;

      if (permission === "denied") {
        deniedRef.current = true;
        setStatusMessage(locationFailureMessage("permission_denied"));
        return;
      }

      setStatusMessage("Sharing your location with the customer…");

      const send = (coords: GeolocationCoordinates) => {
        const now = Date.now();
        if (now - lastSentRef.current < 4_000) return;
        lastSentRef.current = now;

        void fetch(`/api/cleaner/jobs/${jobId}/location`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            lat: coords.latitude,
            lng: coords.longitude,
            accuracy: Number.isFinite(coords.accuracy) ? coords.accuracy : undefined,
            timestamp: new Date().toISOString(),
          }),
        }).then(async (response) => {
          if (!response.ok && process.env.NODE_ENV === "development") {
            const payload = (await response.json().catch(() => null)) as {
              error?: string;
            } | null;
            console.warn("[live-location] update failed", payload?.error);
          }
        });
      };

      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          if (cancelled) return;
          send(position.coords);
        },
        (error) => {
          if (cancelled) return;
          if (error.code === 1) {
            deniedRef.current = true;
            setStatusMessage(locationFailureMessage("permission_denied"));
          } else {
            setStatusMessage(locationFailureMessage("position_unavailable"));
          }
        },
        { enableHighAccuracy: true, maximumAge: 10_000, timeout: 20_000 },
      );

      intervalId = window.setInterval(() => {
        if (cancelled || deniedRef.current) return;
        navigator.geolocation.getCurrentPosition(
          (position) => send(position.coords),
          () => {
            /* watch handler already covers errors */
          },
          { enableHighAccuracy: false, maximumAge: 30_000, timeout: 12_000 },
        );
      }, SHARE_INTERVAL_MS);
    }

    void startSharing();

    return () => {
      cancelled = true;
      if (intervalId != null) window.clearInterval(intervalId);
      if (watchIdRef.current != null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [enabled, geoSupported, jobId]);

  if (!enabled) return null;

  const message = !geoSupported
    ? locationFailureMessage("unsupported")
    : (statusMessage ?? LOCATION_FINDING_MESSAGE);

  return (
    <p className="rounded-xl bg-surface-muted px-4 py-3 text-sm text-ink-muted" role="status">
      {message}
    </p>
  );
}
