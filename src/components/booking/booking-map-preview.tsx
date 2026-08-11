"use client";

import { MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

interface BookingMapPreviewProps {
  latitude?: number | null;
  longitude?: number | null;
  label: string;
  className?: string;
}

/**
 * Confirm-screen map preview. Uses Google Static Maps when a key + coords exist;
 * otherwise a clean address pin card (no fake map).
 * Plain <img> avoids Next image remotePatterns coupling with Maps setup.
 */
export function BookingMapPreview({
  latitude,
  longitude,
  label,
  className,
}: BookingMapPreviewProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const hasCoords =
    typeof latitude === "number" &&
    Number.isFinite(latitude) &&
    typeof longitude === "number" &&
    Number.isFinite(longitude);

  const staticUrl =
    apiKey && hasCoords
      ? [
          "https://maps.googleapis.com/maps/api/staticmap",
          `?center=${latitude},${longitude}`,
          "&zoom=15&size=640x280&scale=2&maptype=roadmap",
          `&markers=color:0x0d9488%7C${latitude},${longitude}`,
          `&key=${apiKey}`,
        ].join("")
      : null;

  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-border bg-surface-muted",
        className,
      )}
    >
      {staticUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- external Static Maps URL
        <img
          src={staticUrl}
          alt={`Map of ${label}`}
          className="aspect-[16/7] w-full object-cover"
          loading="lazy"
          referrerPolicy="no-referrer"
        />
      ) : (
        <div className="flex aspect-[16/7] w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-navy/90 via-navy to-accent/40 px-4 text-center text-white">
          <MapPin className="size-7 text-teal-200" aria-hidden />
          <p className="text-sm font-medium text-white/90">Cleaning location</p>
        </div>
      )}
      <div className="flex items-start gap-2 px-4 py-3">
        <MapPin className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
        <p className="text-sm font-medium leading-snug text-ink">{label}</p>
      </div>
    </div>
  );
}
