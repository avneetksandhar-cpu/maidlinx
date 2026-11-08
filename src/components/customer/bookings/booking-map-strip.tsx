"use client";

/**
 * Compact map strip for Next clean — only when real coordinates exist.
 * Never renders a decorative / fake map path without coords.
 */
export function BookingMapStrip({
  latitude,
  longitude,
  className,
}: {
  latitude: number | null | undefined;
  longitude: number | null | undefined;
  className?: string;
}) {
  if (
    latitude == null ||
    longitude == null ||
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude)
  ) {
    return null;
  }

  const deltaLng = 0.012;
  const deltaLat = 0.006;
  const bbox = [
    longitude - deltaLng,
    latitude - deltaLat,
    longitude + deltaLng,
    latitude + deltaLat,
  ].join("%2C");
  const embedSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${latitude}%2C${longitude}`;

  return (
    <div
      className={
        className ??
        "relative h-[88px] w-full overflow-hidden rounded-t-[12px] bg-[#EEF3EC]"
      }
      aria-hidden
    >
      <iframe
        title=""
        src={embedSrc}
        className="pointer-events-none absolute inset-[-12%] h-[124%] w-[124%] border-0 grayscale-[0.15] contrast-[1.05]"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
      <span className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-white/25" />
      <span className="pointer-events-none absolute left-1/2 top-[44%] flex -translate-x-1/2 -translate-y-full flex-col items-center drop-shadow-[0_4px_10px_rgba(1,25,61,0.28)]">
        <span className="flex size-7 items-center justify-center rounded-full bg-[#04CED2] ring-[2.5px] ring-white">
          <span className="size-2 rounded-full bg-[#01193D]" />
        </span>
        <span className="h-0 w-0 border-x-[5px] border-t-[7px] border-x-transparent border-t-[#04CED2]" />
      </span>
    </div>
  );
}
