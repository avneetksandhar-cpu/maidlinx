"use client";

import { cn } from "@/lib/utils";
import { useState } from "react";

/** Transparent official mark — magenta→cyan wing + pin. No black field. */
const LOGO = {
  src: "/brand/logo.png",
  w: 609,
  h: 908,
} as const;

export type WingmanLogoVariant = "symbol" | "lockup";
export type WingmanLogoTone = "onDark" | "onLight";

type WingmanLogoProps = {
  className?: string;
  /** Height in px. Width follows the official artwork aspect. */
  size?: number;
  title?: string;
  variant?: WingmanLogoVariant;
  tone?: WingmanLogoTone;
};

function FallbackMark({
  width,
  height,
  title,
  className,
}: {
  width: number;
  height: number;
  title: string;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 64 64"
      width={width}
      height={height}
      className={cn("shrink-0", className)}
      role="img"
      aria-label={`${title} (fallback mark)`}
    >
      <defs>
        <linearGradient id="wm-neon" x1="8" y1="4" x2="56" y2="60" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FF2BD6" />
          <stop offset="55%" stopColor="#8B5CFF" />
          <stop offset="100%" stopColor="#00E8F0" />
        </linearGradient>
      </defs>
      <path
        fill="url(#wm-neon)"
        d="M38 6c8 6 16 18 16 32 0 12-10 22-22 22S10 50 10 38C10 22 22 8 38 6c-8 8-12 16-12 26 0 8 6 14 14 14s14-6 14-14C54 20 48 12 38 6Z"
      />
      <path
        fill="#07070c"
        d="M32 24c6 0 10 5 10 12 0 8-10 18-10 18s-10-10-10-18c0-7 4-12 10-12Zm0 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z"
      />
    </svg>
  );
}

/** Official Wingman mark — transparent PNG, no black box. */
export function WingmanLogo({
  className,
  size = 56,
  title = "Wingman",
  variant: _variant = "symbol",
  tone: _tone = "onDark",
}: WingmanLogoProps) {
  const height = size;
  const width = Math.round((size * LOGO.w) / LOGO.h);
  const [failed, setFailed] = useState(false);
  const useFallback = failed || size <= 16;

  if (useFallback) {
    return <FallbackMark width={width} height={height} title={title} className={className} />;
  }

  return (
    <img
      src={LOGO.src}
      alt={title}
      width={width}
      height={height}
      className={cn("shrink-0 bg-transparent object-contain", className)}
      onError={() => setFailed(true)}
      draggable={false}
    />
  );
}

export function WingmanWordmark({
  className,
  logoSize = 32,
  tone = "onDark",
}: {
  className?: string;
  logoSize?: number;
  tone?: WingmanLogoTone;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <WingmanLogo size={logoSize} tone={tone} />
      <span
        className={cn(
          "font-display text-[0.95rem] font-semibold tracking-[-0.03em]",
          tone === "onLight" ? "text-navy" : "text-ink",
        )}
      >
        Wingman
      </span>
    </span>
  );
}
