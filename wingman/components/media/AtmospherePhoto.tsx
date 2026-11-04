"use client";

import { cn } from "@/lib/utils";
import {
  atmosphereForEvent,
  type AtmospherePhoto as AtmospherePhotoRecord,
} from "@/lib/photos/atmosphere";
import type { PublicEvent } from "@/lib/marketplace/queries";
import Image from "next/image";
import { useState } from "react";

export function AtmospherePhoto({
  photo,
  className,
  imageClassName,
  sizes = "430px",
  priority = false,
  showCaption = false,
  overlay = true,
}: {
  photo: AtmospherePhotoRecord;
  className?: string;
  imageClassName?: string;
  sizes?: string;
  priority?: boolean;
  showCaption?: boolean;
  overlay?: boolean;
}) {
  const [failed, setFailed] = useState(false);

  return (
    <figure className={cn("relative h-full overflow-hidden bg-navy", className)}>
      {failed ? (
        <BrandedPhotoFallback className="absolute inset-0" />
      ) : (
        <Image
          src={photo.src}
          alt={photo.alt}
          fill
          priority={priority}
          className={cn("object-cover", imageClassName)}
          style={{ objectPosition: photo.objectPosition }}
          sizes={sizes}
          onError={() => setFailed(true)}
        />
      )}
      {overlay ? (
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-t from-navy/55 via-navy/10 to-transparent"
        />
      ) : null}
      <figcaption className="sr-only">{photo.alt}</figcaption>
      {showCaption ? <span className="sr-only">{photo.caption}</span> : null}
    </figure>
  );
}

export function BrandedPhotoFallback({
  label = "Wingman",
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 bg-navy text-accent",
        className,
      )}
    >
      <svg viewBox="0 0 200 96" width={56} height={27} aria-hidden className="opacity-90">
        <g fill="#C8B38B">
          <path d="M100 92 78 26h11.5L100 66l10.5-40H122L100 92Z" />
          <path d="M74 30C60 14 42 8 18 14c18-1 34 8 46 24-10-8-24-12-40-11 16 3 30 12 40 28l-6-8Z" />
          <path d="M126 30c14-16 32-22 56-16-18-1-34 8-46 24 10-8 24-12 40-11-16 3-30 12-40 28l6-8Z" />
        </g>
      </svg>
      <span className="text-[10px] uppercase tracking-[0.22em]">{label}</span>
    </div>
  );
}

export function EventListingPhoto({
  event,
  className,
  sizes = "430px",
  showCaption = false,
  priority = false,
}: {
  event: Pick<
    PublicEvent,
    | "id"
    | "name"
    | "category"
    | "musicGenre"
    | "eventType"
    | "imageUsageVerified"
    | "imageUrl"
    | "imageAttribution"
  > & { imageAttribution?: string | null };
  className?: string;
  sizes?: string;
  showCaption?: boolean;
  priority?: boolean;
}) {
  const [failed, setFailed] = useState(false);

  const localVerified =
    event.imageUsageVerified && Boolean(event.imageUrl?.startsWith("/")) && !failed;

  if (localVerified && event.imageUrl) {
    return (
      <figure className={cn("relative overflow-hidden bg-navy", className)}>
        <Image
          src={event.imageUrl}
          alt={event.name}
          fill
          priority={priority}
          className="object-cover"
          sizes={sizes}
          onError={() => setFailed(true)}
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-t from-navy/45 via-transparent to-transparent"
        />
        <figcaption className="sr-only">{event.name}</figcaption>
        {showCaption ? (
          <span className="sr-only">
            {event.imageAttribution
              ? `Authorized ${event.imageAttribution} listing photo.`
              : "Licensed listing photo."}
          </span>
        ) : null}
      </figure>
    );
  }

  return (
    <AtmospherePhoto
      photo={atmosphereForEvent(event)}
      className={className}
      sizes={sizes}
      showCaption={showCaption}
      priority={priority}
    />
  );
}
